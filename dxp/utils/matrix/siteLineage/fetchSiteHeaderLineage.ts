import {fetchLineageAssetById, fetchSectionChildrenTree, mergeLineagePayloads} from './fetchSiteLineage.js';
import {isMenuLineageLink} from './lineageLinks.js';
import {isHeaderNavType} from './siteLineageToHeaderNav.js';
import {resolveSiteRootAssetId} from './resolveSiteRootAssetId.js';
import {enrichLineageAssetUrls, normalizeNavigationUrl} from './siteLineageToSectionNav.js';
import {resolveContentApiUrlResolutionBase} from '../pageUrl/index.js';
import {SITE_LINEAGE_LOG_LABELS, siteLineageLog} from './siteLineageLog.js';
import type {DxpComponentInfo, SiteLineagePayload} from './types.js';

const LOG_LABEL = SITE_LINEAGE_LOG_LABELS.headerNav;

function lineageHasAsset(lineage: SiteLineagePayload, assetId: string): boolean {
    return (lineage.assets ?? []).some((asset) => String(asset?.id ?? '').trim() === assetId);
}

export interface FetchSiteHeaderLineageOptions {
    fetchImpl?: typeof fetch;
    maxDepth?: number;
    siteRootAssetId?: string;
}

/** Fetch site header navigation tree (site root hubs + one child level). */
export async function fetchSiteHeaderLineage(info: DxpComponentInfo | undefined, options: FetchSiteHeaderLineageOptions = {}): Promise<SiteLineagePayload> {
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available');
    }

    const urlResolutionBase = resolveContentApiUrlResolutionBase(info);
    const maxDepth = options.maxDepth ?? 2;
    const siteRootId = resolveSiteRootAssetId(info, {
        override: options.siteRootAssetId,
    });

    siteLineageLog(LOG_LABEL, 'fetchSiteHeaderLineage start', {
        siteRootId,
        maxDepth,
        urlResolutionBase: urlResolutionBase || undefined,
    });

    let lineage = await fetchSectionChildrenTree(info, siteRootId, {
        fetchImpl,
        urlResolutionBase,
        maxDepth,
        logLabel: LOG_LABEL,
    });

    const hasSiteRootAsset = lineageHasAsset(lineage, siteRootId);
    let siteRootFetched = false;

    if (!hasSiteRootAsset) {
        const rootAsset = await fetchLineageAssetById(info, siteRootId, {
            fetchImpl,
            urlResolutionBase,
            logLabel: LOG_LABEL,
        });

        if (rootAsset) {
            lineage = mergeLineagePayloads({assets: [rootAsset], links: []}, lineage);
            siteRootFetched = true;
        }
    }

    lineage = enrichLineageAssetUrls(lineage, {
        siteRootId,
        urlResolutionBase: urlResolutionBase || undefined,
    });

    const enrichedAssets = Array.isArray(lineage?.assets) ? lineage.assets : [];
    const headerHubCandidates = enrichedAssets.filter(
        (asset) =>
            isHeaderNavType(asset) &&
            (lineage.links ?? []).some(
                (link) =>
                    isMenuLineageLink(link) && String(link.parent_asset_id ?? '').trim() === siteRootId && String(link.child_asset_id ?? '').trim() === String(asset.id ?? ''),
            ),
    );

    siteLineageLog(LOG_LABEL, 'fetchSiteHeaderLineage complete', {
        siteRootId,
        assetCount: enrichedAssets.length,
        linkCount: Array.isArray(lineage?.links) ? lineage.links.length : 0,
        hasSiteRootAsset: lineageHasAsset(lineage, siteRootId),
        siteRootFetched,
        siteMountPath: urlResolutionBase ? normalizeNavigationUrl(urlResolutionBase) : undefined,
        headerHubCandidatesWithUrl: headerHubCandidates.filter((asset) => Boolean(asset.url?.trim())).length,
        headerHubCandidateCount: headerHubCandidates.length,
    });

    return lineage;
}
