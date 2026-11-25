import {ensureLocalProjectEnvLoaded} from '../../loadProjectEnvFile.js';
import {
    resolveComponentEnv,
    resolveContentApiAuthHeaders,
    assertContentApiFetchUrl,
    resolveContentApiBase,
    resolveContentApiUrlResolutionBase,
    resolveCtxAssetId,
    resolveCtxPageUrl,
    resolveMatrixServiceBase,
} from '../pageUrl/index.js';
import {resolveSiteRootAssetId} from './resolveSiteRootAssetId.js';
import {enrichLineageAssetUrls, resolveSectionRootIdFromLineage} from './siteLineageToSectionNav.js';
import {getRawLinkType, isMenuLineageLink, resolveLineageLinkKind} from './lineageLinks.js';
import {SITE_LINEAGE_LOG_LABELS, resolveSiteLineageLogLabel, siteLineageLog} from './siteLineageLog.js';
import type {DxpComponentInfo, LineageContext, SiteLineageAsset, SiteLineageLink, SiteLineagePayload} from './types.js';

export const DEFAULT_SITE_LINEAGE_PATH = '/site-lineage';

export function buildSiteLineageMatrixServiceUrl(info: DxpComponentInfo | undefined, context: LineageContext = {}): string {
    const serviceBase = resolveMatrixServiceBase(info);
    if (!serviceBase) {
        throw new Error('Matrix service base URL is not configured');
    }

    const {API_SITE_LINEAGE_PATH} = resolveComponentEnv(info);
    const path = API_SITE_LINEAGE_PATH.startsWith('/') ? API_SITE_LINEAGE_PATH : `/${API_SITE_LINEAGE_PATH}`;
    const {assetId = '', pageUrl = '', urlResolutionBase = ''} = context;

    const params = new URLSearchParams({include_dependents: 'true'});
    if (urlResolutionBase) {
        params.set('base_url', urlResolutionBase);
    }
    if (assetId) {
        params.set('assetId', assetId);
    } else {
        params.set('url', pageUrl);
    }

    return `${serviceBase}${path}?${params}`;
}

export function buildSiteLineageContentApiUrl(info: DxpComponentInfo | undefined, context: LineageContext = {}): string {
    const apiBase = resolveContentApiBase(info);
    if (!apiBase) {
        throw new Error('Content API base URL is not configured');
    }

    const {assetId = '', pageUrl = '', urlResolutionBase = ''} = context;
    const params = new URLSearchParams({include_dependents: 'true'});
    if (urlResolutionBase) {
        params.set('base_url', urlResolutionBase);
    }

    if (assetId) {
        return `${apiBase}/assets/${encodeURIComponent(assetId)}/lineage/site?${params}`;
    }

    const urlParams = new URLSearchParams(params);
    urlParams.set('url', pageUrl);
    return `${apiBase}/assets/by_url/lineage/site?${urlParams}`;
}

function isEdgeRuntimeFns(fns: unknown): boolean {
    if (!fns || typeof fns !== 'object') {
        return false;
    }
    const record = fns as Record<string, unknown>;
    return typeof record.resolveUri === 'function' || typeof record.resolveMatrixAssetById === 'function';
}

/** True when running in Matrix Edge / Miniflare (not Node `dev-ui` AMAPI proxy). */
export function isEdgeRuntime(info: DxpComponentInfo | undefined): boolean {
    if (isEdgeRuntimeFns(info?.fns)) {
        return true;
    }

    const ctx = info?.ctx;
    return isEdgeRuntimeFns(ctx);
}

export function buildSiteLineageFetchHeaders(info: DxpComponentInfo | undefined, options: {contentApi?: boolean} = {}): Record<string, string> {
    const headers: Record<string, string> = {Accept: 'application/json'};

    if (options.contentApi) {
        Object.assign(headers, resolveContentApiAuthHeaders(info));
    }

    return headers;
}

async function fetchLineageJson(
    fetchImpl: typeof fetch,
    endpoint: string,
    headers: Record<string, string>,
    logLabel: string = SITE_LINEAGE_LOG_LABELS.relatedContent,
): Promise<SiteLineagePayload> {
    siteLineageLog(logLabel, 'HTTP request', {
        endpoint,
        hasAuthorization: Boolean(headers.Authorization),
    });

    const requestUrl = String(endpoint ?? '').trim();
    if (!requestUrl) {
        throw new Error('Site lineage request URL is empty');
    }
    try {
        new URL(requestUrl);
    } catch {
        throw new Error(`Site lineage request URL is invalid: ${JSON.stringify(requestUrl)}`);
    }

    const response = await fetchImpl(requestUrl, {headers});

    siteLineageLog(logLabel, 'HTTP response', {
        endpoint,
        status: response.status,
        ok: response.ok,
    });

    if (!response.ok) {
        const authHint =
            response.status === 401 && !headers.Authorization
                ? ' — no Authorization header (check component set Matrix API Identifier / BEARER_AUTH)'
                : response.status === 401
                  ? ' — Authorization rejected (check Content API token permissions)'
                  : '';
        throw new Error(`Site lineage request failed with status ${response.status}${authHint} (${endpoint})`);
    }

    return response.json() as Promise<SiteLineagePayload>;
}

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

export function buildSectionChildrenContentApiUrl(
    info: DxpComponentInfo | undefined,
    parentAssetId: string,
    context: {
        urlResolutionBase?: string;
        depth?: number;
        includeAssetTypes?: boolean;
    } = {},
): string {
    const apiBase = resolveContentApiBase(info);
    if (!apiBase) {
        throw new Error('Content API base URL is not configured');
    }

    const depth = Number.isFinite(context.depth) ? context.depth! : 1;
    const params = new URLSearchParams({
        depth: String(Math.min(Math.max(depth, 1), 5)),
        limit: '100',
    });

    if (context.includeAssetTypes !== false) {
        params.set('asset_types', 'page,page_standard,page_content,page_redirect,folder,site');
    }

    if (context.urlResolutionBase) {
        params.set('base_url', context.urlResolutionBase);
    }

    return `${apiBase}/assets/${encodeURIComponent(parentAssetId)}/children?${params}`;
}

export function buildLineageAssetContentApiUrl(info: DxpComponentInfo | undefined, assetId: string, context: {urlResolutionBase?: string; data?: string} = {}): string {
    const apiBase = resolveContentApiBase(info);
    if (!apiBase) {
        throw new Error('Content API base URL is not configured');
    }

    const params = new URLSearchParams();
    if (context.urlResolutionBase) {
        params.set('base_url', context.urlResolutionBase);
    }
    if (context.data?.trim()) {
        params.set('data', context.data.trim());
    }

    const query = params.toString();
    return `${apiBase}/assets/${encodeURIComponent(assetId)}${query ? `?${query}` : ''}`;
}

/** Normalize a Content API asset response to site lineage asset shape. */
export function normalizeContentApiLineageAsset(raw: unknown): SiteLineageAsset | null {
    if (!raw || typeof raw !== 'object') return null;

    const record = raw as Record<string, unknown>;
    const asset = record.asset && typeof record.asset === 'object' && !Array.isArray(record.asset) ? (record.asset as SiteLineageAsset) : (record as SiteLineageAsset);

    const id = String(asset.id ?? '').trim();
    if (!id) return null;

    const resolvedUrl = (() => {
        const direct = typeof asset.url === 'string' ? asset.url.trim() : '';
        if (direct) return direct;

        const webPaths = (asset as SiteLineageAsset).web_paths;
        if (Array.isArray(webPaths) && webPaths.length > 0) {
            const preferred = webPaths.find((entry) => typeof entry === 'string' && entry.trim());
            if (typeof preferred === 'string' && preferred.trim()) {
                return preferred.trim();
            }
        }

        return '';
    })();

    if (resolvedUrl && !asset.url) {
        return {...asset, url: resolvedUrl};
    }

    return asset;
}

/** Fetch a single asset from the Content API for lineage transforms. */
export async function fetchLineageAssetById(
    info: DxpComponentInfo | undefined,
    assetId: string,
    options: {
        fetchImpl: typeof fetch;
        urlResolutionBase?: string;
        logLabel?: string;
    },
): Promise<SiteLineageAsset | null> {
    const logLabel = resolveSiteLineageLogLabel(options.logLabel);
    const endpoint = buildLineageAssetContentApiUrl(info, assetId, {
        urlResolutionBase: options.urlResolutionBase,
    });
    const headers = buildSiteLineageFetchHeaders(info, {contentApi: true});

    siteLineageLog(logLabel, 'HTTP request', {
        endpoint,
        hasAuthorization: Boolean(headers.Authorization),
    });

    assertContentApiFetchUrl(endpoint, logLabel);
    const response = await options.fetchImpl(endpoint, {headers});

    siteLineageLog(logLabel, 'HTTP response', {
        endpoint,
        status: response.status,
        ok: response.ok,
    });

    if (!response.ok) {
        return null;
    }

    const raw: unknown = await response.json();
    return normalizeContentApiLineageAsset(raw);
}

export {isMenuLineageLink} from './lineageLinks.js';

export async function fetchSectionChildrenTree(
    info: DxpComponentInfo | undefined,
    sectionRootId: string,
    options: {
        fetchImpl: typeof fetch;
        urlResolutionBase?: string;
        maxDepth?: number;
        logLabel?: string;
    },
): Promise<SiteLineagePayload> {
    const {fetchImpl} = options;
    const maxDepth = options.maxDepth ?? 5;
    const logLabel = resolveSiteLineageLogLabel(options.logLabel);
    const headers = buildSiteLineageFetchHeaders(info, {contentApi: true});

    let merged: SiteLineagePayload = {links: [], assets: []};
    let frontier: string[] = [sectionRootId];
    const visitedParents = new Set<string>();

    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
        const nextFrontier: string[] = [];

        siteLineageLog(logLabel, 'children frontier', {
            depth,
            frontier,
            sectionRootId,
        });

        for (const parentId of frontier) {
            if (!parentId || visitedParents.has(parentId)) continue;
            visitedParents.add(parentId);

            let rawPayload: SiteLineagePayload = {links: [], assets: []};
            try {
                let endpoint = buildSectionChildrenContentApiUrl(info, parentId, {
                    urlResolutionBase: options.urlResolutionBase,
                    depth: 1,
                    includeAssetTypes: true,
                });

                rawPayload = await fetchLineageJson(fetchImpl, endpoint, headers, logLabel);

                if (!Array.isArray(rawPayload?.links) || rawPayload.links.length === 0) {
                    endpoint = buildSectionChildrenContentApiUrl(info, parentId, {
                        urlResolutionBase: options.urlResolutionBase,
                        depth: 1,
                        includeAssetTypes: false,
                    });
                    rawPayload = await fetchLineageJson(fetchImpl, endpoint, headers, logLabel);
                }
            } catch (error) {
                siteLineageLog(logLabel, 'children fetch failed — skipping branch', {
                    parentId,
                    error,
                });
                continue;
            }

            const menuLinkCount = (rawPayload.links ?? []).filter(isMenuLineageLink).length;

            siteLineageLog(logLabel, 'children payload', {
                parentId,
                rawLinkCount: Array.isArray(rawPayload?.links) ? rawPayload.links.length : 0,
                rawAssetCount: Array.isArray(rawPayload?.assets) ? rawPayload.assets.length : 0,
                menuLinkCount,
                rawLinks: (Array.isArray(rawPayload?.links) ? rawPayload.links : []).slice(0, 20).map((link) => ({
                    parent: link?.parent_asset_id,
                    child: link?.child_asset_id,
                    link_type: getRawLinkType(link),
                    kind: resolveLineageLinkKind(link),
                })),
                keptAssets: (rawPayload.assets ?? []).slice(0, 20).map((asset) => ({
                    id: asset?.id,
                    type: asset?.type,
                    name: asset?.name || asset?.short_name,
                    url: asset?.url,
                })),
            });

            merged = mergeLineagePayloads(merged, rawPayload);

            for (const link of rawPayload.links ?? []) {
                if (String(link.parent_asset_id ?? '').trim() !== parentId) continue;
                if (!isMenuLineageLink(link)) continue;
                const childId = String(link.child_asset_id ?? '').trim();
                if (childId && !visitedParents.has(childId)) {
                    nextFrontier.push(childId);
                }
            }
        }

        frontier = nextFrontier;
    }

    return merged;
}

async function fetchDirectChildrenPayload(
    info: DxpComponentInfo | undefined,
    parentAssetId: string,
    options: {
        fetchImpl: typeof fetch;
        urlResolutionBase?: string;
        useContentApiAuth: boolean;
    },
): Promise<SiteLineagePayload> {
    const headers = buildSiteLineageFetchHeaders(info, {
        contentApi: options.useContentApiAuth,
    });

    let endpoint = buildSectionChildrenContentApiUrl(info, parentAssetId, {
        urlResolutionBase: options.urlResolutionBase,
        depth: 1,
        includeAssetTypes: true,
    });

    let rawPayload = await fetchLineageJson(options.fetchImpl, endpoint, headers);

    if (!Array.isArray(rawPayload?.links) || rawPayload.links.length === 0) {
        endpoint = buildSectionChildrenContentApiUrl(info, parentAssetId, {
            urlResolutionBase: options.urlResolutionBase,
            depth: 1,
            includeAssetTypes: false,
        });
        rawPayload = await fetchLineageJson(options.fetchImpl, endpoint, headers);
    }

    return rawPayload;
}

/** Merge direct child pages of the placement asset into a lineage payload. */
export async function expandLineageWithPlacementChildren(
    info: DxpComponentInfo | undefined,
    lineage: SiteLineagePayload,
    options: {
        fetchImpl?: typeof fetch;
        placementAssetId?: string;
    } = {},
): Promise<SiteLineagePayload> {
    const contentApiBase = resolveContentApiBase(info);
    if (!contentApiBase) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.inThisSection, 'skip placement children expand (no Content API base)');
        return lineage;
    }

    const placementAssetId = options.placementAssetId ?? resolveCtxAssetId(info);
    if (!placementAssetId) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.inThisSection, 'skip placement children expand (no placement asset ID)');
        return lineage;
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.inThisSection, 'skip placement children expand (no fetch)');
        return lineage;
    }

    const {BEARER_AUTH} = resolveComponentEnv(info);
    const edge = isEdgeRuntime(info);
    if (edge && !BEARER_AUTH) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.inThisSection, 'placement children expand on Edge without BEARER_AUTH — attempting Content API request', {placementAssetId});
    }

    const urlResolutionBase = resolveContentApiUrlResolutionBase(info);

    try {
        const childrenPayload = await fetchDirectChildrenPayload(info, placementAssetId, {
            fetchImpl,
            urlResolutionBase,
            useContentApiAuth: Boolean(BEARER_AUTH),
        });

        const merged = mergeLineagePayloads(lineage, childrenPayload);

        siteLineageLog(SITE_LINEAGE_LOG_LABELS.inThisSection, 'expanded placement children', {
            placementAssetId,
            childrenAssets: Array.isArray(childrenPayload?.assets) ? childrenPayload.assets.length : 0,
            childrenLinks: Array.isArray(childrenPayload?.links) ? childrenPayload.links.length : 0,
            childIds: (childrenPayload.links ?? []).filter((link) => String(link.parent_asset_id ?? '').trim() === placementAssetId).map((link) => link.child_asset_id),
            expandedAssets: Array.isArray(merged.assets) ? merged.assets.length : 0,
            expandedLinks: Array.isArray(merged.links) ? merged.links.length : 0,
        });

        return merged;
    } catch (error) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.inThisSection, 'failed to expand placement children from Content API', {placementAssetId, error});
        return lineage;
    }
}

export async function expandSiteLineageWithSectionChildren(
    info: DxpComponentInfo | undefined,
    lineage: SiteLineagePayload,
    options: {
        fetchImpl?: typeof fetch;
        assetId?: string;
        pageUrl?: string;
    } = {},
): Promise<SiteLineagePayload> {
    const contentApiBase = resolveContentApiBase(info);
    if (!contentApiBase) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'skip section children expand (no MX_API / Content API base)');
        return lineage;
    }

    const {BEARER_AUTH} = resolveComponentEnv(info);
    if (!BEARER_AUTH) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'skip section children expand (BEARER_AUTH missing)');
        return lineage;
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'skip section children expand (no fetch)');
        return lineage;
    }

    const assetId = options.assetId ?? resolveCtxAssetId(info);
    const pageUrl = options.pageUrl ?? resolveCtxPageUrl(info);
    const sectionRootId = resolveSectionRootIdFromLineage(lineage, {
        assetId,
        pageUrl,
    });

    siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'section root for children expand', {
        assetId,
        pageUrl,
        sectionRootId: sectionRootId || undefined,
        lineageAssetIds: (Array.isArray(lineage?.assets) ? lineage.assets : []).map((asset) => asset?.id),
        lineageLinks: Array.isArray(lineage?.links) ? lineage.links : [],
    });

    if (!sectionRootId) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'skip section children expand (no section root)');
        return lineage;
    }

    const urlResolutionBase = resolveContentApiUrlResolutionBase(info);

    try {
        const childrenPayload = await fetchSectionChildrenTree(info, sectionRootId, {
            fetchImpl,
            urlResolutionBase,
            maxDepth: 5,
        });

        const merged = mergeLineagePayloads(lineage, childrenPayload);
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'expanded section children', {
            sectionRootId,
            lineageAssets: Array.isArray(lineage?.assets) ? lineage.assets.length : 0,
            lineageLinks: Array.isArray(lineage?.links) ? lineage.links.length : 0,
            childrenAssets: Array.isArray(childrenPayload?.assets) ? childrenPayload.assets.length : 0,
            childrenLinks: Array.isArray(childrenPayload?.links) ? childrenPayload.links.length : 0,
            expandedAssets: Array.isArray(merged.assets) ? merged.assets.length : 0,
            expandedLinks: Array.isArray(merged.links) ? merged.links.length : 0,
            expandedAssetIds: merged.assets?.map((asset) => asset?.id),
        });
        return merged;
    } catch (error) {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'failed to expand section children from Content API', {sectionRootId, error});
        return lineage;
    }
}

export async function fetchSiteLineage(
    info: DxpComponentInfo | undefined,
    options: {
        fetchImpl?: typeof fetch;
        expandSectionChildren?: boolean;
    } = {},
): Promise<SiteLineagePayload> {
    ensureLocalProjectEnvLoaded(info);
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available');
    }

    const assetId = resolveCtxAssetId(info);
    const pageUrl = resolveCtxPageUrl(info);
    const urlResolutionBase = resolveContentApiUrlResolutionBase(info);
    const requestContext: LineageContext = {
        assetId,
        pageUrl,
        urlResolutionBase,
    };
    const {BASE_DOMAIN, BASE_PATH, BEARER_AUTH, MX_API} = resolveComponentEnv(info);
    const contentApiBase = resolveContentApiBase(info);
    const edge = isEdgeRuntime(info);
    const expandSectionChildren = options.expandSectionChildren ?? Boolean(contentApiBase && BEARER_AUTH);

    siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'fetchSiteLineage start', {
        assetId: assetId || undefined,
        pageUrl: pageUrl || undefined,
        urlResolutionBase: urlResolutionBase || undefined,
        edge,
        hasMxApi: Boolean(MX_API || contentApiBase),
        hasBearer: Boolean(BEARER_AUTH),
        hasBaseDomain: Boolean(BASE_DOMAIN),
        hasBasePath: Boolean(BASE_PATH),
        expandSectionChildren,
    });

    if (!assetId && !pageUrl) {
        throw new Error('No placement asset ID or page URL available for site lineage request');
    }

    let lineage: SiteLineagePayload;
    let source = '';

    if (contentApiBase && BEARER_AUTH) {
        const endpoint = buildSiteLineageContentApiUrl(info, requestContext);
        source = 'content-api-lineage';
        lineage = await fetchLineageJson(fetchImpl, endpoint, buildSiteLineageFetchHeaders(info, {contentApi: true}));
    } else if (contentApiBase) {
        throw new Error(
            isEdgeRuntime(info)
                ? 'BEARER_AUTH is not configured on the component set — attach this component to a component set with a Matrix API Identifier (same as related-content). See docs/CODING_STANDARDS.md.'
                : 'BEARER_AUTH is not configured for Content API site lineage request',
        );
    } else if (BASE_DOMAIN && BASE_PATH) {
        const endpoint = buildSiteLineageMatrixServiceUrl(info, requestContext);
        source = 'matrix-service-proxy';
        lineage = await fetchLineageJson(fetchImpl, endpoint, buildSiteLineageFetchHeaders(info));
    } else {
        throw new Error('Content API base URL is not configured (use AMAPI for local Matrix access — see docs/ARCHITECTURE.md)');
    }

    siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'lineage fetched', {
        source,
        assetCount: Array.isArray(lineage?.assets) ? lineage.assets.length : 0,
        linkCount: Array.isArray(lineage?.links) ? lineage.links.length : 0,
        assetIds: (Array.isArray(lineage?.assets) ? lineage.assets : []).map((asset) => asset?.id),
        links: Array.isArray(lineage?.links) ? lineage.links : [],
    });

    if (expandSectionChildren) {
        lineage = await expandSiteLineageWithSectionChildren(info, lineage, {
            fetchImpl,
            assetId,
            pageUrl,
        });
    } else {
        siteLineageLog(SITE_LINEAGE_LOG_LABELS.relatedContent, 'section children expand disabled', {
            expandSectionChildren,
            hasContentApiBase: Boolean(contentApiBase),
            hasBearer: Boolean(BEARER_AUTH),
        });
    }

    const siteRootId = resolveSiteRootAssetId(info);
    lineage = enrichLineageAssetUrls(lineage, {
        siteRootId,
        urlResolutionBase: urlResolutionBase || undefined,
    });

    return lineage;
}
