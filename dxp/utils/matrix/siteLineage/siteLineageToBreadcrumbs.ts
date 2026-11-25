import {buildLineageLinkLookup, getLineageLinkForChild, isHiddenLinkFromParent, isMenuLineageLink} from './lineageLinks.js';
import {
    applyDerivedChildUrlsFromParents,
    applyDerivedUrlsFromPageContext,
    buildLineageMaps,
    getSiteRootIds,
    isNavigableAsset,
    normalizeNavigationUrl,
    resolveAssetIdByUrl,
    resolveAssetName,
    resolveAssetNavigationUrl,
} from './siteLineageToSectionNav.js';
import {parseHomepagePathsFromEnv} from './homepagePaths.js';
import type {BreadcrumbItem, LineageContext, SiteLineageAsset, SiteLineagePayload} from './types.js';

const NOT_FOUND_TITLE_PATTERN = /page not found|404 proxy|\b404\b/i;

const DEFAULT_HOMEPAGE_PATHS = parseHomepagePathsFromEnv('');

function homepagePathsForContext(context: LineageContext): ReadonlySet<string> {
    return context.homepagePaths ?? DEFAULT_HOMEPAGE_PATHS;
}

export function isHomepagePath(url: string | undefined, homepagePaths: ReadonlySet<string> = DEFAULT_HOMEPAGE_PATHS): boolean {
    const normalized = normalizeNavigationUrl(url);
    if (!normalized) return false;
    return homepagePaths.has(normalized);
}

function isNotFoundTitle(title: string): boolean {
    return NOT_FOUND_TITLE_PATTERN.test(title);
}

export function siteLineageToBreadcrumbs(lineage: SiteLineagePayload, context: LineageContext = {}): BreadcrumbItem[] {
    const homepagePaths = homepagePathsForContext(context);

    if (isHomepagePath(context.pageUrl, homepagePaths)) {
        return [];
    }

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

    const currentAsset = assetById.get(normalizedCurrentId);
    const currentUrl = resolveAssetNavigationUrl(currentAsset);
    if (isHomepagePath(currentUrl, homepagePaths)) {
        return [];
    }

    const currentName = resolveAssetName(currentAsset);
    if (isNotFoundTitle(currentName)) {
        return [];
    }

    const ancestorChain: string[] = [];
    let nodeId: string | undefined = normalizedCurrentId;
    const seen = new Set<string>();

    while (nodeId && !seen.has(nodeId)) {
        seen.add(nodeId);
        ancestorChain.push(nodeId);
        nodeId = parentMap.get(nodeId);
    }

    const linkLookup = buildLineageLinkLookup(lineage.links);
    const breadcrumbs: BreadcrumbItem[] = [];

    for (const [index, assetId] of ancestorChain.entries()) {
        const asset = assetById.get(assetId);
        if (!asset || !isNavigableAsset(asset)) continue;

        const isCurrent = assetId === normalizedCurrentId;
        // Allow-list: skip ancestors whose link from their parent is not Type 1
        // (Type 2 hidden, Type 3, notice, reference, unknown, untyped). The current
        // page is always kept, and assets with no inbound link (site root) stay.
        if (!isCurrent) {
            const link = getLineageLinkForChild(assetId, linkLookup, parentMap.get(assetId));
            if (link && !isMenuLineageLink(link)) {
                continue;
            }
        }

        // A folder is not a page. Drop it when its link to the next trail item is
        // hidden (TYPE_2). Other asset types keep their place in the trail.
        const nextOnTrail = index > 0 ? ancestorChain[index - 1] : undefined;
        if (!isCurrent && asset.type === 'folder' && nextOnTrail !== undefined && isHiddenLinkFromParent(assetId, nextOnTrail, linkLookup)) {
            continue;
        }

        const url = resolveAssetNavigationUrl(asset);
        if (!url) continue;

        let title = resolveAssetName(asset);
        if (isHomepagePath(url, homepagePaths)) {
            title = 'Home';
        }
        if (!title) continue;

        if (isNotFoundTitle(title)) {
            return [];
        }

        breadcrumbs.push({title, url});
    }

    breadcrumbs.reverse();
    return breadcrumbs;
}
