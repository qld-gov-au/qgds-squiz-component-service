import {resolveContentApiBase} from '../pageUrl/index.js';
import {buildSiteLineageFetchHeaders, normalizeContentApiLineageAsset} from './fetchSiteLineage.js';
import {resolveLineageMetadataBag} from './lineageMetadataBag.js';
import {SITE_ROOT_ASSET_ID} from './siteLineageToHeaderNav.js';
import {summarizeRawHeaderMetadata} from './siteMetadataToHeader.js';
import {SITE_LINEAGE_LOG_LABELS, resolveSiteLineageLogLabel, siteLineageLog} from './siteLineageLog.js';
import type {DxpComponentInfo} from './types.js';

export type FetchSiteRootMetadataOptions = {
    fetchImpl: typeof fetch;
    urlResolutionBase?: string;
    logLabel?: string;
};

/** Fetch site-root asset metadata bag from Content API. */
export async function fetchSiteRootMetadata(info: DxpComponentInfo | undefined, options: FetchSiteRootMetadataOptions): Promise<Record<string, unknown> | null> {
    const logLabel = resolveSiteLineageLogLabel(options.logLabel ?? SITE_LINEAGE_LOG_LABELS.headerMetadata);
    const contentApiBase = resolveContentApiBase(info);
    if (!contentApiBase) {
        throw new Error('Content API base URL is not configured');
    }

    const params = new URLSearchParams();
    params.set('data', 'metadata');
    if (options.urlResolutionBase) {
        params.set('base_url', options.urlResolutionBase);
    }

    const endpoint = `${contentApiBase}/assets/${encodeURIComponent(SITE_ROOT_ASSET_ID)}?${params.toString()}`;
    const headers = buildSiteLineageFetchHeaders(info, {contentApi: true});

    siteLineageLog(logLabel, 'metadata request', {
        endpoint,
        siteRootId: SITE_ROOT_ASSET_ID,
        hasAuthorization: Boolean(headers.Authorization),
    });

    const response = await options.fetchImpl(endpoint, {headers});
    siteLineageLog(logLabel, 'metadata response', {
        status: response.status,
        ok: response.ok,
    });

    if (!response.ok) {
        return null;
    }

    const raw: unknown = await response.json();
    const asset = normalizeContentApiLineageAsset(raw);
    const metadata = resolveLineageMetadataBag(raw, asset);

    if (raw && typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        siteLineageLog(logLabel, 'site-root asset payload keys', {
            topKeys: Object.keys(record),
            assetId: asset?.id,
            hasNormalizedMetadata: Boolean(metadata),
            metadataKeyCount: metadata ? Object.keys(metadata).length : 0,
            metadataKeys: metadata ? Object.keys(metadata).slice(0, 40) : [],
        });
    }

    siteLineageLog(logLabel, 'raw header metadata fields', summarizeRawHeaderMetadata(metadata));

    return metadata;
}
