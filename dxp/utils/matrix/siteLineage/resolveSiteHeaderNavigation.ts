import {resolveAmapiConfigFromInfo, resolveAmapiProxyConfig} from '../contentApiLocalProxy/index.js';
import {resolveLineageContentApiFetchImpl} from '../contentApiLocalProxy/resolveLineageContentApiFetchImpl.js';
import previewHeaderNavigation from './fixtures/preview-header-navigation.json';
import {fetchSiteHeaderLineage} from './fetchSiteHeaderLineage.js';
import {isEdgeRuntime} from './fetchSiteLineage.js';
import {applyHeaderNavUrlPrefix, resolveHeaderNavUrlPrefix} from './headerNavUrlPrefix.js';
import {resolveSiteRootAssetId} from './resolveSiteRootAssetId.js';
import {isHeaderNavType, siteLineageToHeaderNav} from './siteLineageToHeaderNav.js';
import {isNavigableAsset, summarizeLineageAssetsForDiagnostics} from './siteLineageToSectionNav.js';
import {hasAbsoluteHttpContentApiBase, resolveComponentEnv, resolveContentApiBase} from '../pageUrl/index.js';
import {SITE_LINEAGE_LOG_LABELS, siteLineageLog} from './siteLineageLog.js';
import type {DxpComponentInfo, ResolveSiteHeaderNavigationOptions, SectionNavigationItem} from './types.js';

const LOG_LABEL = SITE_LINEAGE_LOG_LABELS.headerNav;

function shouldUseLocalLineagePreviewFallback(info: DxpComponentInfo | undefined): boolean {
    if (!isEdgeRuntime(info)) {
        return true;
    }
    return Boolean(resolveAmapiConfigFromInfo(info));
}

function logHeaderNav(message: string, payload?: unknown): void {
    siteLineageLog(LOG_LABEL, message, payload);
}

function normalizeOverrideNavigation(value: unknown): SectionNavigationItem[] | undefined {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    return value as SectionNavigationItem[];
}

function resolvePreviewFallback(info: DxpComponentInfo | undefined): {
    usePreview: boolean;
    reason: string;
} {
    const env = resolveComponentEnv(info);
    const contentApiBase = resolveContentApiBase(info);
    const canUseContentApi = hasAbsoluteHttpContentApiBase(info) && Boolean(env.BEARER_AUTH);
    const envConfigured = canUseContentApi || Boolean(env.BASE_DOMAIN && env.BASE_PATH && env.BEARER_AUTH);

    if (typeof info?.ctx === 'object' && info.ctx !== null && info.ctx.editor && !envConfigured) {
        return {usePreview: true, reason: 'editor'};
    }

    if (!env.API_IDENTIFIER && !(env.BASE_DOMAIN && env.BASE_PATH) && !contentApiBase) {
        return {usePreview: true, reason: 'matrix-env-not-configured'};
    }

    if (contentApiBase && !env.BEARER_AUTH) {
        return {usePreview: true, reason: 'content-api-bearer-missing'};
    }

    return {usePreview: false, reason: ''};
}

/** Resolve site header navigation for DXP edge components. */
export async function resolveSiteHeaderNavigation(info: DxpComponentInfo | undefined, options: ResolveSiteHeaderNavigationOptions = {}): Promise<SectionNavigationItem[]> {
    const overrideNavigation = normalizeOverrideNavigation(options.overrideNavigation);
    if (overrideNavigation) {
        logHeaderNav('using override navigation', {
            count: overrideNavigation.length,
        });
        return applyHeaderNavUrlPrefix(overrideNavigation, resolveHeaderNavUrlPrefix(info));
    }

    const previewItems = Array.isArray(options.previewItems) ? options.previewItems : (previewHeaderNavigation as SectionNavigationItem[]);

    const preview = resolveAmapiConfigFromInfo(info) || options.fetchImpl ? {usePreview: false, reason: ''} : resolvePreviewFallback(info);
    if (preview.usePreview) {
        logHeaderNav('using preview navigation fixture', {
            reason: preview.reason,
        });
        return previewItems;
    }

    const env = resolveComponentEnv(info);
    const contentApiBase = resolveContentApiBase(info);

    logHeaderNav('resolve start', {
        siteRootId: resolveSiteRootAssetId(info, {
            override: options.siteRootAssetId,
        }),
        hasApiIdentifier: Boolean(env.API_IDENTIFIER),
        hasBaseDomain: Boolean(env.BASE_DOMAIN),
        hasBasePath: Boolean(env.BASE_PATH),
        hasMxApi: Boolean(contentApiBase),
        hasBearer: Boolean(env.BEARER_AUTH),
        baseDomain: env.BASE_DOMAIN || undefined,
        mxApi: contentApiBase || undefined,
    });

    const amapiConfig = resolveAmapiProxyConfig(info);
    const fetchImpl = options.fetchImpl ?? resolveLineageContentApiFetchImpl(info);

    if (amapiConfig && !options.fetchImpl) {
        logHeaderNav('using AMAPI Content API proxy', {
            matrixOrigin: amapiConfig.matrixOrigin,
        });
    }

    try {
        const siteRootId = resolveSiteRootAssetId(info, {
            override: options.siteRootAssetId,
        });
        const lineage = await fetchSiteHeaderLineage(info, {
            fetchImpl,
            maxDepth: options.maxDepth,
            siteRootAssetId: options.siteRootAssetId,
        });

        const lineageAssets = Array.isArray(lineage?.assets) ? lineage.assets : [];
        const pageContentCount = lineageAssets.filter((asset) => isHeaderNavType(asset)).length;
        const headerNavEligibleCount = lineageAssets.filter((asset) => isHeaderNavType(asset) && isNavigableAsset(asset)).length;

        const headerNavUrlPrefix = resolveHeaderNavUrlPrefix(info);

        const items = applyHeaderNavUrlPrefix(siteLineageToHeaderNav(lineage, siteRootId), headerNavUrlPrefix);

        logHeaderNav('transform result', {
            siteRootId,
            assetCount: lineageAssets.length,
            linkCount: Array.isArray(lineage?.links) ? lineage.links.length : 0,
            pageContentCount,
            headerNavEligibleCount,
            itemCount: items.length,
            hubTitles: items.map((item) => item?.title),
            headerNavUrlPrefix: headerNavUrlPrefix || undefined,
            sampleNavUrls: items.slice(0, 3).map((item) => item.url),
            assets: summarizeLineageAssetsForDiagnostics(lineage),
        });

        if (items.length === 0) {
            logHeaderNav('lineage transformed to empty navigation', {
                siteRootId,
                assets: summarizeLineageAssetsForDiagnostics(lineage),
            });

            if (shouldUseLocalLineagePreviewFallback(info)) {
                logHeaderNav('local dev empty nav — falling back to preview fixture');
                return previewItems;
            }
        }

        return items;
    } catch (error) {
        logHeaderNav('failed to resolve site header navigation from site lineage', {
            siteRootId: resolveSiteRootAssetId(info, {
                override: options.siteRootAssetId,
            }),
            error,
        });

        if (shouldUseLocalLineagePreviewFallback(info)) {
            logHeaderNav('local dev fetch failed — falling back to preview fixture');
            return previewItems;
        }

        return [];
    }
}
