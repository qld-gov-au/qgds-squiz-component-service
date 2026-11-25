import {amapiAssetToLineageAsset} from '../contentApiLocalProxy/amapiToContentApiShape.js';
import {resolveContentApiBase} from '../pageUrl/index.js';
import {buildLineageAssetContentApiUrl, buildSiteLineageFetchHeaders, normalizeContentApiLineageAsset} from './fetchSiteLineage.js';
import {resolveLineageMetadataBag} from './lineageMetadataBag.js';
import {SITE_LINEAGE_LOG_LABELS, resolveSiteLineageLogLabel, siteLineageLog} from './siteLineageLog.js';
import type {DxpComponentInfo} from './types.js';

export type FetchLineageAssetMetadataOptions = {
    fetchImpl: typeof fetch;
    urlResolutionBase?: string;
    logLabel?: string;
};

/** Fetch a page asset metadata bag (`?data=metadata`) for lineage enrichment. */
export async function fetchLineageAssetMetadataBag(
    info: DxpComponentInfo | undefined,
    assetId: string,
    options: FetchLineageAssetMetadataOptions,
): Promise<Record<string, unknown> | null> {
    const id = String(assetId ?? '').trim();
    if (!id) {
        return null;
    }

    const contentApiBase = resolveContentApiBase(info);
    if (!contentApiBase) {
        return null;
    }

    const logLabel = resolveSiteLineageLogLabel(options.logLabel ?? SITE_LINEAGE_LOG_LABELS.headerNav);
    const endpoint = buildLineageAssetContentApiUrl(info, id, {
        urlResolutionBase: options.urlResolutionBase,
        data: 'metadata',
    });
    const headers = buildSiteLineageFetchHeaders(info, {contentApi: true});

    siteLineageLog(logLabel, 'asset metadata request', {
        assetId: id,
        endpoint,
        hasAuthorization: Boolean(headers.Authorization),
    });

    const response = await options.fetchImpl(endpoint, {headers});
    siteLineageLog(logLabel, 'asset metadata response', {
        assetId: id,
        status: response.status,
        ok: response.ok,
    });

    if (!response.ok) {
        return null;
    }

    const raw: unknown = await response.json();
    const asset = amapiAssetToLineageAsset(raw) ?? normalizeContentApiLineageAsset(raw);
    const metadata = resolveLineageMetadataBag(raw, asset);

    siteLineageLog(logLabel, 'asset metadata resolved', {
        assetId: id,
        hasMetadata: Boolean(metadata && Object.keys(metadata).length > 0),
        metadataKeyCount: metadata ? Object.keys(metadata).length : 0,
        metadataKeys: metadata ? Object.keys(metadata).slice(0, 25) : [],
    });

    return metadata;
}
