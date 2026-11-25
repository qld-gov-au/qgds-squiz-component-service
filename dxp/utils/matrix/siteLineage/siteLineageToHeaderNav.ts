import {buildLineageLinkLookup, isMenuLinkedChild} from './lineageLinks.js';
import {isHomepagePath} from './siteLineageToBreadcrumbs.js';
import {applyDerivedChildUrlsFromParents, buildLineageMaps, isNavigableAsset, resolveAssetName, resolveAssetNavigationUrl} from './siteLineageToSectionNav.js';
import {DEFAULT_SITE_ROOT_ASSET_ID} from './resolveSiteRootAssetId.js';
import type {SectionNavigationItem, SiteLineageAsset, SiteLineageLink, SiteLineagePayload} from './types.js';

export {DEFAULT_SITE_ROOT_ASSET_ID, DEFAULT_SITE_ROOT_ASSET_ID as SITE_ROOT_ASSET_ID, resolveSiteRootAssetId} from './resolveSiteRootAssetId.js';
import {isSiteLineageDebugEnabled} from './siteLineageLog.js';

interface HeaderNavTransformStats {
    wrongType: number;
    missingNameOrUrl: number;
    hiddenLink: number;
    notEligible: number;
}

function logHeaderNavTransform(payload: Record<string, unknown>): void {
    if (!isSiteLineageDebugEnabled()) {
        return;
    }

    console.error('Site header: transform diagnostics', payload);
}

/** Asset types eligible to appear in the header menu. */
const HEADER_NAV_TYPES = new Set(['page_content', 'page_redirect', 'page_standard']);

/** Exported so fetch/diagnostic code uses the same header type gate. */
export function isHeaderNavType(asset: SiteLineageAsset | null | undefined): boolean {
    if (!asset || typeof asset !== 'object') return false;
    return HEADER_NAV_TYPES.has(String(asset.type ?? '').trim());
}

function isHeaderNavAsset(asset: SiteLineageAsset | null | undefined): boolean {
    return isHeaderNavType(asset) && isNavigableAsset(asset);
}

function isTopLevelHeaderHomepageItem(asset: SiteLineageAsset | null | undefined): boolean {
    if (!asset) return false;

    if (isHomepagePath(resolveAssetNavigationUrl(asset))) {
        return true;
    }

    const shortName =
        typeof asset.short_name === 'string'
            ? asset.short_name.trim().toLowerCase()
            : typeof asset.attributes?.short_name === 'string'
              ? asset.attributes.short_name.trim().toLowerCase()
              : '';

    if (shortName === 'homepage') {
        return true;
    }

    return resolveAssetName(asset).trim().toLowerCase() === 'homepage';
}

function collectVisibleHeaderNavChildren(
    parentAssetId: string,
    siteRootId: string,
    assetById: Map<string, SiteLineageAsset>,
    childrenMap: Map<string, string[]>,
    linkLookup: Map<string, SiteLineageLink>,
    stats?: HeaderNavTransformStats,
): SectionNavigationItem[] {
    const childIds = childrenMap.get(parentAssetId) ?? [];
    const items: SectionNavigationItem[] = [];

    for (const childId of childIds) {
        // Allow-list: only Type 1 (menu) links render. Type 2 (hidden), Type 3,
        // notice, reference, unknown and untyped links are dropped together with
        // their whole subtree (no recursion, children are not promoted).
        if (!isMenuLinkedChild(childId, linkLookup, parentAssetId)) {
            if (stats) stats.hiddenLink += 1;
            continue;
        }

        const asset = assetById.get(childId);
        if (parentAssetId === siteRootId && isTopLevelHeaderHomepageItem(asset)) {
            continue;
        }

        if (!isHeaderNavAsset(asset)) {
            if (stats && asset) {
                if (isHeaderNavType(asset)) {
                    stats.missingNameOrUrl += 1;
                } else {
                    stats.wrongType += 1;
                }
                stats.notEligible += 1;
            }
            continue;
        }

        const item = buildHeaderNavigationItem(childId, siteRootId, assetById, childrenMap, linkLookup, stats);
        if (item) {
            items.push(item);
        }
    }

    return items;
}

function buildHeaderNavigationItem(
    assetId: string,
    siteRootId: string,
    assetById: Map<string, SiteLineageAsset>,
    childrenMap: Map<string, string[]>,
    linkLookup: Map<string, SiteLineageLink> = new Map(),
    stats?: HeaderNavTransformStats,
): SectionNavigationItem | null {
    const asset = assetById.get(assetId);
    if (!asset || !isHeaderNavAsset(asset)) return null;

    const title = resolveAssetName(asset);
    const url = resolveAssetNavigationUrl(asset);
    if (!title || !url) {
        if (stats) stats.missingNameOrUrl += 1;
        return null;
    }

    const children = collectVisibleHeaderNavChildren(assetId, siteRootId, assetById, childrenMap, linkLookup, stats);

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

/** Map site lineage (children of site root) to header navigation hubs + children. */
export function siteLineageToHeaderNav(lineage: SiteLineagePayload, siteRootId: string = DEFAULT_SITE_ROOT_ASSET_ID): SectionNavigationItem[] {
    const assets = Array.isArray(lineage?.assets) ? lineage.assets : [];
    if (assets.length === 0) {
        logHeaderNavTransform({
            rejectReason: 'noAssets',
            siteRootId,
        });
        return [];
    }

    const assetById = new Map<string, SiteLineageAsset>();
    for (const asset of assets) {
        if (!asset || typeof asset !== 'object') continue;
        const id = String(asset.id ?? '').trim();
        if (id) assetById.set(id, asset);
    }

    const {childrenMap} = buildLineageMaps(lineage);
    const siteRootChildren = childrenMap.get(siteRootId) ?? [];

    if (!assetById.has(siteRootId) && siteRootChildren.length === 0) {
        logHeaderNavTransform({
            rejectReason: 'noChildren',
            siteRootId,
            hasSiteRootAsset: false,
        });
        return [];
    }

    if (!assetById.has(siteRootId)) {
        assetById.set(siteRootId, {
            id: siteRootId,
            type: 'site',
            url: '/',
        });
    }

    applyDerivedChildUrlsFromParents(assetById, childrenMap);

    const linkLookup = buildLineageLinkLookup(lineage.links);
    const stats: HeaderNavTransformStats = {
        wrongType: 0,
        missingNameOrUrl: 0,
        hiddenLink: 0,
        notEligible: 0,
    };

    const items = collectVisibleHeaderNavChildren(siteRootId, siteRootId, assetById, childrenMap, linkLookup, stats);

    if (items.length === 0) {
        logHeaderNavTransform({
            rejectReason: siteRootChildren.length === 0 ? 'noChildren' : 'allChildrenFiltered',
            siteRootId,
            hasSiteRootAsset: assetById.has(siteRootId),
            siteRootChildCount: siteRootChildren.length,
            ...stats,
        });
    }

    return items;
}
