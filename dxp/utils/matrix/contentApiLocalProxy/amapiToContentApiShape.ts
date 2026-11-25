import type {RawAmapiAsset, RawAmapiLink, SiteLineageAsset, SiteLineageLink, SiteLineagePayload} from './types.js';
import {trimString} from '../trimString/index.js';

/** Resolve a navigable URL from AMAPI asset fields (web_paths, url, attributes). */
export function pickUrlFromAmapiAsset(asset: RawAmapiAsset | null | undefined): string {
    if (!asset || typeof asset !== 'object') return '';

    const webPaths = asset.web_paths;
    if (Array.isArray(webPaths) && webPaths.length > 0) {
        const preferred = webPaths.find((entry) => typeof entry === 'string' && entry.trim());
        if (typeof preferred === 'string') {
            try {
                if (preferred.startsWith('http')) {
                    return new URL(preferred).pathname.replace(/\/$/, '') || '/';
                }
                return preferred.replace(/\/$/, '') || '/';
            } catch {
                return preferred;
            }
        }
    }

    const directUrl = trimString(asset.url);
    if (directUrl) return directUrl;

    const attrs = asset.attributes ?? {};
    const attrUrl = trimString(attrs.url);
    if (attrUrl) return attrUrl;

    return '';
}

/** Map one AMAPI asset to Content API / site lineage asset shape. */
export function amapiAssetToLineageAsset(raw: unknown): SiteLineageAsset | null {
    if (!raw || typeof raw !== 'object') return null;

    const outer = raw as Record<string, unknown>;
    const asset = outer.asset && typeof outer.asset === 'object' && !Array.isArray(outer.asset) ? (outer.asset as RawAmapiAsset) : (outer as RawAmapiAsset);

    const id = String(asset.id ?? '').trim();
    if (!id) return null;

    const attrs = asset.attributes ?? {};
    const name = trimString(asset.name) || trimString(attrs.name) || trimString(asset.short_name) || trimString(attrs.short_name);
    const shortName = trimString(asset.short_name) || trimString(attrs.short_name) || undefined;
    const url = pickUrlFromAmapiAsset(asset);

    const lineageAsset: SiteLineageAsset = {
        id,
        type: trimString(asset.type) || undefined,
        name: name || undefined,
        url: url || undefined,
        status: asset.status?.code ? {code: String(asset.status.code)} : undefined,
    };

    if (shortName) {
        lineageAsset.short_name = shortName;
    }

    if (Array.isArray(asset.urls)) {
        lineageAsset.urls = asset.urls;
    }

    if (attrs && Object.keys(attrs).length > 0) {
        lineageAsset.attributes = attrs as Record<string, unknown>;
    }

    // Prefer Content API–shaped `metadata`; fall back to AMAPI `metadata_values`.
    const metadata =
        (asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata) ? asset.metadata : null) ??
        (asset.metadata_values && typeof asset.metadata_values === 'object' && !Array.isArray(asset.metadata_values) ? asset.metadata_values : null) ??
        (outer.metadata && typeof outer.metadata === 'object' && !Array.isArray(outer.metadata) ? (outer.metadata as Record<string, unknown>) : null) ??
        (outer.metadata_values && typeof outer.metadata_values === 'object' && !Array.isArray(outer.metadata_values) ? (outer.metadata_values as Record<string, unknown>) : null);

    if (metadata && Object.keys(metadata).length > 0) {
        lineageAsset.metadata = metadata;
    }

    return lineageAsset;
}

function normalizeLinkType(linkType: unknown): string | number | undefined {
    if (linkType == null || linkType === '') return undefined;
    if (typeof linkType === 'number') return linkType;

    const normalized = String(linkType).trim().toLowerCase();
    if (normalized === 'menu' || normalized === 'type_1' || normalized === 'type-1') {
        return 'menu';
    }
    if (normalized === 'hidden' || normalized === 'type_2' || normalized === 'type-2') {
        return 'hidden';
    }
    if (normalized === 'reference') {
        return 'reference';
    }
    return linkType as string | number;
}

function normalizeChildLink(parentAssetId: string, link: RawAmapiLink): SiteLineageLink | null {
    const childId = String(link.minor_id ?? link.child_asset_id ?? '').trim();
    const parentId = String(link.major_id ?? link.parent_asset_id ?? parentAssetId).trim();

    if (!childId || !parentId || childId === parentId) {
        return null;
    }

    const linkType = normalizeLinkType(link.link_type ?? link.type);
    if (linkType === 'reference') {
        return null;
    }

    const normalized: SiteLineageLink = {
        parent_asset_id: parentId,
        child_asset_id: childId,
    };

    if (linkType != null) {
        normalized.link_type = linkType;
    }

    return normalized;
}

/** Filter and normalize AMAPI down-links to Content API lineage links (menu order preserved). */
export function normalizeAmapiChildLinks(parentAssetId: string, rawLinks: unknown): SiteLineageLink[] {
    if (!Array.isArray(rawLinks)) return [];

    const childLinks = rawLinks
        .filter((link) => {
            if (!link || typeof link !== 'object') return false;
            const row = link as RawAmapiLink;
            const isChildLink = String(row.major_id ?? '') === parentAssetId && Boolean(row.minor_id) && String(row.minor_id) !== parentAssetId;
            const isLegacyChildLink = String(row.parent_asset_id ?? '') === parentAssetId && Boolean(row.child_asset_id) && String(row.child_asset_id) !== parentAssetId;
            return isChildLink || isLegacyChildLink;
        })
        .sort((a, b) => {
            const orderA = (a as RawAmapiLink).sort_order ?? 0;
            const orderB = (b as RawAmapiLink).sort_order ?? 0;
            return orderA - orderB;
        })
        .map((link) => normalizeChildLink(parentAssetId, link as RawAmapiLink))
        .filter((link): link is SiteLineageLink => Boolean(link));

    return childLinks;
}

function normalizeParentLink(childAssetId: string, link: RawAmapiLink): SiteLineageLink | null {
    const parentId = String(link.major_id ?? link.parent_asset_id ?? '').trim();
    const childId = String(link.minor_id ?? link.child_asset_id ?? childAssetId).trim();

    if (!parentId || !childId || parentId === childId) {
        return null;
    }

    const linkType = normalizeLinkType(link.link_type ?? link.type);
    if (linkType === 'reference') {
        return null;
    }

    const normalized: SiteLineageLink = {
        parent_asset_id: parentId,
        child_asset_id: childId,
    };

    if (linkType != null) {
        normalized.link_type = linkType;
    }

    return normalized;
}

/** Normalize AMAPI up-links to Content API lineage links. */
export function normalizeAmapiParentLinks(childAssetId: string, rawLinks: unknown): SiteLineageLink[] {
    if (!Array.isArray(rawLinks)) return [];

    return rawLinks
        .filter((link) => {
            if (!link || typeof link !== 'object') return false;
            const row = link as RawAmapiLink;
            return String(row.minor_id ?? row.child_asset_id ?? '') === childAssetId && Boolean(row.major_id ?? row.parent_asset_id);
        })
        .sort((a, b) => {
            const orderA = (a as RawAmapiLink).sort_order ?? 0;
            const orderB = (b as RawAmapiLink).sort_order ?? 0;
            return orderA - orderB;
        })
        .map((link) => normalizeParentLink(childAssetId, link as RawAmapiLink))
        .filter((link): link is SiteLineageLink => Boolean(link));
}

/** Build a Content API children payload from parent id, links, and child assets. */
export function buildChildrenPayload(parentAssetId: string, links: SiteLineageLink[], assets: SiteLineageAsset[], parentAsset?: SiteLineageAsset | null): SiteLineagePayload {
    const payloadAssets = [...assets];
    if (parentAsset) {
        const hasParent = payloadAssets.some((asset) => String(asset.id ?? '') === parentAssetId);
        if (!hasParent) {
            payloadAssets.unshift(parentAsset);
        }
    }

    return {
        links: links.filter((link) => String(link.parent_asset_id ?? '') === parentAssetId),
        assets: payloadAssets,
    };
}

/** Merge lineage payloads without duplicate ids. */
export function mergeLineagePayloads(base: SiteLineagePayload, extra: SiteLineagePayload): SiteLineagePayload {
    const assetById = new Map<string, SiteLineageAsset>();
    for (const asset of [...(Array.isArray(base?.assets) ? base.assets : []), ...(Array.isArray(extra?.assets) ? extra.assets : [])]) {
        if (!asset || typeof asset !== 'object') continue;
        const id = String(asset.id ?? '').trim();
        if (id) assetById.set(id, asset);
    }

    const linksByKey = new Map<string, SiteLineageLink>();
    for (const link of [...(Array.isArray(base?.links) ? base.links : []), ...(Array.isArray(extra?.links) ? extra.links : [])]) {
        if (!link || typeof link !== 'object') continue;
        const parentId = String(link.parent_asset_id ?? '').trim();
        const childId = String(link.child_asset_id ?? '').trim();
        if (!parentId || !childId) continue;
        linksByKey.set(`${parentId}->${childId}`, link);
    }

    return {
        assets: [...assetById.values()],
        links: [...linksByKey.values()],
    };
}
