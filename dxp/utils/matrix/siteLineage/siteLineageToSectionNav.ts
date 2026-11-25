import {buildLineageLinkLookup, isHiddenLinkedAsset, isHiddenLinkFromParent, isMenuLinkedChild, resolveLineageLinkKind} from './lineageLinks.js';
import type {LineageContext, SectionNavigationItem, SiteLineageAsset, SiteLineageLink, SiteLineagePayload} from './types.js';

const NAVIGABLE_TYPES = new Set(['page', 'page_standard', 'page_content', 'page_redirect', 'folder', 'site']);

const EXCLUDED_STATUS_CODES = new Set(['archived', 'trashed', 'deleted']);

function coerceUrlEntry(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';

    const record = value as Record<string, unknown>;
    const path = typeof record.path === 'string' ? record.path.trim() : '';
    if (path) return path;

    const url = typeof record.url === 'string' ? record.url.trim() : '';
    return url;
}

export function normalizeNavigationUrl(value: unknown): string {
    const raw = coerceUrlEntry(value);
    if (!raw) return '';

    let pathWithExtras = raw;

    if (/^https?:\/\//i.test(raw)) {
        try {
            const parsed = new URL(raw);
            const path = parsed.pathname.replace(/\/$/, '') || '/';
            pathWithExtras = `${path}${parsed.search}${parsed.hash}`;
        } catch {
            pathWithExtras = raw;
        }
    } else {
        const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
        pathWithExtras = withLeadingSlash.replace(/\/$/, '') || '/';
    }

    return pathWithExtras.replace(/\/_nocache$/i, '') || '/';
}

export function resolveAssetName(asset: SiteLineageAsset | null | undefined): string {
    if (!asset || typeof asset !== 'object') return '';

    const attributes = asset.attributes && typeof asset.attributes === 'object' ? asset.attributes : {};

    for (const candidate of [asset.name, asset.short_name, attributes.name, attributes.short_name]) {
        const resolved = coerceAssetTextField(candidate);
        if (resolved) {
            return resolved;
        }
    }

    return '';
}

function coerceAssetTextField(field: unknown): string {
    if (typeof field === 'string' && field.trim()) {
        return field.trim();
    }

    if (field && typeof field === 'object' && 'value' in field) {
        const value = (field as {value?: unknown}).value;
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return '';
}

function resolveWebPathsNavigationUrl(asset: SiteLineageAsset | null | undefined): string {
    if (!asset || typeof asset !== 'object') return '';

    const webPaths = asset.web_paths;
    if (!Array.isArray(webPaths) || webPaths.length === 0) return '';

    const preferred = webPaths.find((entry) => typeof entry === 'string' && entry.trim());

    if (typeof preferred !== 'string' || !preferred.trim()) return '';

    return normalizeNavigationUrl(preferred);
}

export function resolveAssetNavigationUrl(asset: SiteLineageAsset | null | undefined): string {
    if (!asset || typeof asset !== 'object') return '';

    const direct = normalizeNavigationUrl(asset.url);
    if (direct) return direct;

    const urls = Array.isArray(asset.urls) ? asset.urls : [];
    for (const entry of urls) {
        const resolved = normalizeNavigationUrl(entry);
        if (resolved) return resolved;
    }

    const webPathsUrl = resolveWebPathsNavigationUrl(asset);
    if (webPathsUrl) return webPathsUrl;

    const attributes = asset.attributes && typeof asset.attributes === 'object' ? asset.attributes : {};
    const attributeUrl = normalizeNavigationUrl(attributes.url);
    if (attributeUrl) return attributeUrl;

    return '';
}

/** Seed site-mount and parent/child URL paths when Content API omits resolved urls. */
export function enrichLineageAssetUrls(
    lineage: SiteLineagePayload,
    options: {
        siteRootId?: string;
        urlResolutionBase?: string;
    } = {},
): SiteLineagePayload {
    const assets = Array.isArray(lineage?.assets) ? lineage.assets : [];
    if (assets.length === 0) return lineage;

    const assetById = new Map<string, SiteLineageAsset>();
    for (const asset of assets) {
        if (!asset || typeof asset !== 'object') continue;
        const id = String(asset.id ?? '').trim();
        if (!id) continue;

        const resolvedUrl = resolveAssetNavigationUrl(asset);
        assetById.set(id, resolvedUrl && !asset.url ? {...asset, url: resolvedUrl} : {...asset});
    }

    const siteRootId = options.siteRootId?.trim();
    const siteMountPath = options.urlResolutionBase ? normalizeNavigationUrl(options.urlResolutionBase) : '';

    if (siteRootId && siteMountPath) {
        const root = assetById.get(siteRootId);
        if (root && !resolveAssetNavigationUrl(root)) {
            assetById.set(siteRootId, {...root, url: siteMountPath});
        }
    }

    const {childrenMap} = buildLineageMaps(lineage);
    applyDerivedChildUrlsFromParents(assetById, childrenMap);

    return {
        links: lineage.links,
        assets: [...assetById.values()],
    };
}

export function isNavigableAsset(asset: unknown): boolean {
    if (!asset || typeof asset !== 'object') return false;

    const lineageAsset = asset as SiteLineageAsset & {
        status?: {code?: string} | string;
    };
    const statusCode = typeof lineageAsset.status === 'string' ? lineageAsset.status : lineageAsset.status?.code;
    if (typeof statusCode === 'string' && EXCLUDED_STATUS_CODES.has(statusCode)) {
        return false;
    }

    const type = typeof lineageAsset.type === 'string' ? lineageAsset.type : '';
    if (type && !NAVIGABLE_TYPES.has(type)) {
        return false;
    }

    const url = resolveAssetNavigationUrl(lineageAsset);
    const name = resolveAssetName(lineageAsset);

    return url !== '' && name !== '';
}

export function applyDerivedUrlsFromPageContext(
    assetById: Map<string, SiteLineageAsset>,
    parentMap: Map<string, string>,
    currentAssetId: string,
    pageUrl: string | undefined,
): void {
    const pagePath = normalizeNavigationUrl(pageUrl);
    if (!pagePath || !currentAssetId) return;

    const chain: string[] = [];
    let nodeId: string | undefined = currentAssetId;
    const seen = new Set<string>();

    while (nodeId && !seen.has(nodeId)) {
        seen.add(nodeId);
        chain.push(nodeId);
        nodeId = parentMap.get(nodeId) ?? '';
    }

    let path = pagePath;
    for (const assetId of chain) {
        const asset = assetById.get(assetId);
        if (asset && !resolveAssetNavigationUrl(asset)) {
            assetById.set(assetId, {...asset, url: path});
        }

        const slash = path.lastIndexOf('/');
        path = slash <= 0 ? '/' : path.slice(0, slash) || '/';
    }
}

export function slugifyNavigationSegment(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function resolveAssetUrlSegment(asset: SiteLineageAsset | null | undefined): string {
    if (!asset || typeof asset !== 'object') return '';

    const attributes = asset.attributes && typeof asset.attributes === 'object' ? asset.attributes : {};

    for (const candidate of [asset.short_name, attributes.short_name]) {
        const resolved = coerceAssetTextField(candidate);
        if (!resolved) continue;
        if (/^[a-z0-9][a-z0-9_-]*$/i.test(resolved) && resolved.includes('-')) {
            return resolved.toLowerCase();
        }
        if (/^[a-z0-9_-]+$/i.test(resolved) && !/\s/.test(resolved)) {
            return resolved.toLowerCase();
        }
    }

    return slugifyNavigationSegment(resolveAssetName(asset));
}

export function applyDerivedChildUrlsFromParents(assetById: Map<string, SiteLineageAsset>, childrenMap: Map<string, string[]>): void {
    const queue: string[] = [];

    for (const [assetId, asset] of assetById.entries()) {
        if (resolveAssetNavigationUrl(asset)) {
            queue.push(assetId);
        }
    }

    const seen = new Set<string>();

    while (queue.length > 0) {
        const parentId = queue.shift();
        if (!parentId || seen.has(parentId)) continue;
        seen.add(parentId);

        const parentUrl = resolveAssetNavigationUrl(assetById.get(parentId));
        if (!parentUrl) continue;

        const childIds = childrenMap.get(parentId) ?? [];
        for (const childId of childIds) {
            const child = assetById.get(childId);
            if (!child) continue;

            if (!resolveAssetNavigationUrl(child)) {
                const segment = resolveAssetUrlSegment(child);
                if (segment) {
                    const childUrl = parentUrl === '/' ? `/${segment}` : `${parentUrl}/${segment}`;
                    assetById.set(childId, {...child, url: childUrl});
                }
            }

            if (!seen.has(childId)) {
                queue.push(childId);
            }
        }
    }
}

export function buildLineageMaps(lineage: SiteLineagePayload): {
    parentMap: Map<string, string>;
    childrenMap: Map<string, string[]>;
    childIds: Set<string>;
} {
    const parentMap = new Map<string, string>();
    const childrenMap = new Map<string, string[]>();
    const childIds = new Set<string>();

    const links = Array.isArray(lineage?.links) ? lineage.links : [];

    for (const link of links) {
        if (!link || typeof link !== 'object') continue;

        const parentId = String(link.parent_asset_id ?? '').trim();
        const childId = String(link.child_asset_id ?? '').trim();
        if (!parentId || !childId) continue;

        parentMap.set(childId, parentId);
        childIds.add(childId);

        const siblings = childrenMap.get(parentId) ?? [];
        if (!siblings.includes(childId)) {
            siblings.push(childId);
            childrenMap.set(parentId, siblings);
        }
    }

    return {parentMap, childrenMap, childIds};
}

export function getSiteRootIds(assetById: Map<string, SiteLineageAsset>, childIds: Set<string>): Set<string> {
    const siteRootIds = new Set<string>();

    for (const assetId of assetById.keys()) {
        if (!childIds.has(assetId)) {
            siteRootIds.add(assetId);
        }
    }

    return siteRootIds;
}

export function findSectionRootId(currentAssetId: string, parentMap: Map<string, string>, siteRootIds: Set<string>): string {
    let nodeId: string | undefined = currentAssetId;
    let sectionRootId = currentAssetId;

    while (nodeId && parentMap.has(nodeId)) {
        const parentId = parentMap.get(nodeId);
        if (parentId && siteRootIds.has(parentId)) {
            sectionRootId = nodeId;
            break;
        }
        nodeId = parentId;
        sectionRootId = nodeId ?? sectionRootId;
    }

    return sectionRootId;
}

export function resolveSectionRootIdFromLineage(lineage: SiteLineagePayload, context: LineageContext = {}): string {
    const assets = Array.isArray(lineage?.assets) ? lineage.assets : [];
    if (assets.length === 0) return '';

    const assetById = new Map<string, SiteLineageAsset>();
    for (const asset of assets) {
        if (!asset || typeof asset !== 'object') continue;
        const id = String(asset.id ?? '').trim();
        if (id) assetById.set(id, asset);
    }

    if (assetById.size === 0) return '';

    const {parentMap, childIds} = buildLineageMaps(lineage);
    const siteRootIds = getSiteRootIds(assetById, childIds);

    let currentAssetId = typeof context.assetId === 'string' ? context.assetId.trim() : '';

    if (!currentAssetId) {
        currentAssetId = resolveAssetIdByUrl(context.pageUrl, assetById) ?? '';
    }

    if (!currentAssetId) {
        currentAssetId = String(assets[0]?.id ?? '');
    }

    if (!currentAssetId) return '';

    return findSectionRootId(String(currentAssetId), parentMap, siteRootIds);
}

/**
 * A folder whose child links are all TYPE_2 (hidden). It does not link to a
 * page of its own, so it is not listed.
 */
function isFolderWithOnlyHiddenLinks(
    folderId: string,
    assetById: Map<string, SiteLineageAsset>,
    childrenMap: Map<string, string[]>,
    linkLookup: Map<string, SiteLineageLink>,
): boolean {
    if (assetById.get(folderId)?.type !== 'folder') return false;

    const childIds = childrenMap.get(folderId) ?? [];
    return childIds.length > 0 && childIds.every((childId) => isHiddenLinkFromParent(folderId, childId, linkLookup));
}

/**
 * List the children of a parent. A hidden folder (TYPE_2 inbound) is not listed
 * and not searched. A folder whose child links are all TYPE_2 is not listed
 * either, and its pages move up into its place. Those pages are linked only
 * through the hidden links, so they skip the inbound check (`promoted`).
 */
function collectNavItems(
    parentAssetId: string,
    childIds: string[],
    promoted: boolean,
    assetById: Map<string, SiteLineageAsset>,
    childrenMap: Map<string, string[]>,
    linkLookup: Map<string, SiteLineageLink>,
): SectionNavigationItem[] {
    const items: SectionNavigationItem[] = [];

    for (const childId of childIds) {
        // Allow-list: only Type 1 (menu) links render. Type 2, Type 3, notice,
        // reference, unknown and untyped links are dropped with their subtree.
        // Promoted children arrive via a hidden folder, so skip this check for them.
        if (!promoted && !isMenuLinkedChild(childId, linkLookup, parentAssetId)) {
            continue;
        }

        if (isFolderWithOnlyHiddenLinks(childId, assetById, childrenMap, linkLookup)) {
            items.push(...collectNavItems(childId, childrenMap.get(childId) ?? [], true, assetById, childrenMap, linkLookup));
            continue;
        }

        const item = buildNavigationItem(childId, assetById, childrenMap, linkLookup);
        if (item) {
            items.push(item);
        }
    }

    return items;
}

function collectVisibleNavChildren(
    parentAssetId: string,
    assetById: Map<string, SiteLineageAsset>,
    childrenMap: Map<string, string[]>,
    linkLookup: Map<string, SiteLineageLink>,
): SectionNavigationItem[] {
    return collectNavItems(parentAssetId, childrenMap.get(parentAssetId) ?? [], false, assetById, childrenMap, linkLookup);
}

export function buildNavigationItem(
    assetId: string,
    assetById: Map<string, SiteLineageAsset>,
    childrenMap: Map<string, string[]>,
    linkLookup: Map<string, SiteLineageLink> = new Map(),
): SectionNavigationItem | null {
    const asset = assetById.get(assetId);
    if (!asset || !isNavigableAsset(asset)) return null;

    const title = resolveAssetName(asset);
    const url = resolveAssetNavigationUrl(asset);
    if (!title || !url) return null;

    const children = collectVisibleNavChildren(assetId, assetById, childrenMap, linkLookup);

    const item: SectionNavigationItem = {
        id: String(asset.id ?? assetId),
        title,
        url,
    };

    const shortName =
        typeof asset.short_name === 'string' && asset.short_name.trim()
            ? asset.short_name.trim()
            : typeof asset.attributes?.short_name === 'string' && asset.attributes.short_name.trim()
              ? asset.attributes.short_name.trim()
              : '';

    if (shortName) {
        item.shortName = shortName;
    }
    if (typeof asset.type === 'string' && asset.type.trim()) {
        item.assetType = asset.type.trim();
    }
    if (children.length > 0) {
        item.children = children;
    }

    return item;
}

export function resolveAssetIdByUrl(pageUrl: string | undefined, assetById: Map<string, SiteLineageAsset>): string | undefined {
    const normalizedPageUrl = normalizeNavigationUrl(pageUrl);

    if (!normalizedPageUrl) return undefined;

    for (const asset of assetById.values()) {
        const assetUrl = resolveAssetNavigationUrl(asset);
        if (assetUrl && assetUrl === normalizedPageUrl) {
            return String(asset.id);
        }
    }

    return undefined;
}

export function summarizeLineageAssetsForDiagnostics(lineage: SiteLineagePayload): {
    id: string;
    type: string;
    name: string;
    url: string;
    navigable: boolean;
}[] {
    const assets = Array.isArray(lineage?.assets) ? lineage.assets : [];
    return assets.slice(0, 12).map((asset) => ({
        id: String(asset?.id ?? ''),
        type: typeof asset?.type === 'string' ? asset.type : '',
        name: resolveAssetName(asset),
        url: resolveAssetNavigationUrl(asset),
        navigable: isNavigableAsset(asset),
    }));
}

/**
 * Section nav only: a link with no link type is treated as a menu link.
 * Typed links (Type 1, 2, 3, notice, reference) are left unchanged.
 */
function buildUntypedVisibleLinkLookup(links: SiteLineageLink[] | undefined): Map<string, SiteLineageLink> {
    const normalised = (Array.isArray(links) ? links : []).map((link) => {
        if (!link || typeof link !== 'object') return link;
        return resolveLineageLinkKind(link) === 'missing' ? {...link, type: 1} : link;
    });
    return buildLineageLinkLookup(normalised);
}

export function siteLineageToSectionNav(lineage: SiteLineagePayload, context: LineageContext = {}): SectionNavigationItem[] {
    const assets = Array.isArray(lineage?.assets) ? lineage.assets : [];
    if (assets.length === 0) return [];

    const assetById = new Map<string, SiteLineageAsset>();
    for (const asset of assets) {
        if (!asset || typeof asset !== 'object') continue;
        const id = String(asset.id ?? '').trim();
        if (id) assetById.set(id, asset);
    }

    if (assetById.size === 0) return [];

    const {parentMap, childrenMap, childIds} = buildLineageMaps(lineage);
    const siteRootIds = getSiteRootIds(assetById, childIds);

    let currentAssetId = typeof context.assetId === 'string' ? context.assetId.trim() : '';

    if (!currentAssetId) {
        currentAssetId = resolveAssetIdByUrl(context.pageUrl, assetById) ?? '';
    }

    if (!currentAssetId) {
        const firstRootId = [...siteRootIds].find((id) => isNavigableAsset(assetById.get(id)));
        currentAssetId = firstRootId ?? String(assets[0]?.id ?? '');
    }

    if (!currentAssetId) {
        return [];
    }

    if (!assetById.has(String(currentAssetId)) && typeof context.pageUrl === 'string' && context.pageUrl.trim()) {
        const fromUrl = resolveAssetIdByUrl(context.pageUrl, assetById);
        if (fromUrl) {
            currentAssetId = fromUrl;
        }
    }

    const normalizedCurrentId = String(currentAssetId);
    const placementKnownToTree = parentMap.has(normalizedCurrentId) || childIds.has(normalizedCurrentId);

    if (!assetById.has(normalizedCurrentId) && !placementKnownToTree) {
        return [];
    }

    applyDerivedUrlsFromPageContext(assetById, parentMap, normalizedCurrentId, context.pageUrl);

    applyDerivedChildUrlsFromParents(assetById, childrenMap);

    const sectionRootId = findSectionRootId(normalizedCurrentId, parentMap, siteRootIds);

    const linkLookup = context.untypedLinksVisible ? buildUntypedVisibleLinkLookup(lineage.links) : buildLineageLinkLookup(lineage.links);

    const sectionRoot = buildNavigationItem(sectionRootId, assetById, childrenMap, linkLookup);

    return sectionRoot ? [sectionRoot] : [];
}
