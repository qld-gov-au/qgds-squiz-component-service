import previewBreadcrumbs from './fixtures/preview-breadcrumbs.json';
import {fetchSiteLineage} from './fetchSiteLineage.js';
import {resolveHomepagePaths} from './homepagePaths.js';
import {siteLineageToBreadcrumbs} from './siteLineageToBreadcrumbs.js';
import {resolveComponentEnv, resolveContentApiBase, resolveCtxAssetId, resolveCtxPageUrl} from '../pageUrl/index.js';
import type {BreadcrumbItem, DxpComponentInfo, ResolveBreadcrumbsOptions} from './types.js';

// Only expected fallbacks (warnings) and failures (errors) are logged.
// Normal results, including an empty trail on the homepage, stay silent.
function logWarning(...args: unknown[]): void {
    console.warn(...args);
}

function logError(...args: unknown[]): void {
    console.error(...args);
}

function resolvePreviewFallback(info: DxpComponentInfo | undefined): {
    usePreview: boolean;
    reason: string;
} {
    if (!resolveCtxAssetId(info) && !resolveCtxPageUrl(info)) {
        return {usePreview: true, reason: 'no-placement'};
    }

    return {usePreview: false, reason: ''};
}

/** Resolve breadcrumb trail for DXP edge components. */
export async function resolveBreadcrumbs(info: DxpComponentInfo | undefined, options: ResolveBreadcrumbsOptions = {}): Promise<BreadcrumbItem[]> {
    const previewItems = Array.isArray(options.previewItems) ? options.previewItems : (previewBreadcrumbs as BreadcrumbItem[]);

    const preview = resolvePreviewFallback(info);
    if (preview.usePreview) {
        logWarning('Breadcrumbs: using preview breadcrumbs fixture', preview.reason);
        return previewItems;
    }

    const assetId = resolveCtxAssetId(info);
    const pageUrl = resolveCtxPageUrl(info);
    const env = resolveComponentEnv(info);
    const contentApiBase = resolveContentApiBase(info);

    if (!env.API_IDENTIFIER && !(env.BASE_DOMAIN && env.BASE_PATH) && !contentApiBase) {
        logWarning('Breadcrumbs: Matrix env is not configured for placement asset', assetId || pageUrl);
        return [];
    }

    try {
        const lineage = await fetchSiteLineage(info, {
            fetchImpl: options.fetchImpl,
            expandSectionChildren: false,
        });

        return siteLineageToBreadcrumbs(lineage, {
            assetId,
            pageUrl,
            homepagePaths: resolveHomepagePaths(info),
        });
    } catch (error) {
        logError('Failed to resolve breadcrumbs from site lineage for placement asset', assetId || pageUrl, error);
        return [];
    }
}
