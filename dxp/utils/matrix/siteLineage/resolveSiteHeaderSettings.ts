import {resolveAmapiConfigFromInfo} from '../contentApiLocalProxy/index.js';
import {resolveLineageContentApiFetchImpl} from '../contentApiLocalProxy/resolveLineageContentApiFetchImpl.js';
import {resolveComponentEnv, resolveContentApiBase, resolveContentApiUrlResolutionBase} from '../pageUrl/index.js';
import previewHeaderSettings from './fixtures/preview-header-settings.json';
import {fetchSiteRootMetadata} from './fetchSiteRootMetadata.js';
import {isEdgeRuntime} from './fetchSiteLineage.js';
import {SITE_LINEAGE_LOG_LABELS, siteLineageLog} from './siteLineageLog.js';
import {SITE_ROOT_ASSET_ID} from './siteLineageToHeaderNav.js';
import {siteMetadataToHeaderSettings, summarizeRawHeaderMetadata, type SiteHeaderSettings} from './siteMetadataToHeader.js';
import type {DxpComponentInfo} from './types.js';

export type ResolveSiteHeaderSettingsOptions = {
    overrideData?: Partial<SiteHeaderSettings> | null;
    previewData?: SiteHeaderSettings;
    fetchImpl?: typeof fetch;
};

const LOG_LABEL = SITE_LINEAGE_LOG_LABELS.headerMetadata;

function resolvePreviewFallback(info: DxpComponentInfo | undefined): {
    usePreview: boolean;
    reason: string;
} {
    const env = resolveComponentEnv(info);
    const contentApiBase = resolveContentApiBase(info);
    const envConfigured = Boolean(env.API_IDENTIFIER || (env.BASE_DOMAIN && env.BASE_PATH) || contentApiBase) && (!contentApiBase || Boolean(env.BEARER_AUTH));

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

function normalizeHeaderSettings(value: unknown): SiteHeaderSettings | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Partial<SiteHeaderSettings>;

    return {
        enableTranslation: typeof record.enableTranslation === 'boolean' ? record.enableTranslation : true,
    };
}

const DEFAULT_SETTINGS: SiteHeaderSettings = {
    enableTranslation: true,
};

/** Resolve header metadata settings from site-root metadata for DXP edge components. */
export async function resolveSiteHeaderSettings(info: DxpComponentInfo | undefined, options: ResolveSiteHeaderSettingsOptions = {}): Promise<SiteHeaderSettings> {
    const override = normalizeHeaderSettings(options.overrideData);
    if (override) {
        siteLineageLog(LOG_LABEL, 'using override data', override);
        return override;
    }

    const preview = normalizeHeaderSettings(options.previewData) ?? (previewHeaderSettings as SiteHeaderSettings);

    const previewFallback = resolveAmapiConfigFromInfo(info) || options.fetchImpl ? {usePreview: false, reason: ''} : resolvePreviewFallback(info);
    if (previewFallback.usePreview) {
        siteLineageLog(LOG_LABEL, 'using preview fixture', {
            reason: previewFallback.reason,
            settings: preview,
        });
        return preview;
    }

    const urlResolutionBase = resolveContentApiUrlResolutionBase(info);

    const fetchImpl = options.fetchImpl ?? resolveLineageContentApiFetchImpl(info) ?? globalThis.fetch;

    if (typeof fetchImpl !== 'function') {
        siteLineageLog(LOG_LABEL, 'fetch unavailable — falling back to preview', {
            settings: preview,
        });
        return preview;
    }

    try {
        const metadata = await fetchSiteRootMetadata(info, {
            fetchImpl,
            urlResolutionBase,
            logLabel: LOG_LABEL,
        });

        if (!metadata) {
            siteLineageLog(LOG_LABEL, 'no metadata on site root', {
                siteRootId: SITE_ROOT_ASSET_ID,
            });
            if (!isEdgeRuntime(info)) {
                return preview;
            }
            return DEFAULT_SETTINGS;
        }

        siteLineageLog(LOG_LABEL, 'raw metadata fields (resolve)', summarizeRawHeaderMetadata(metadata));
        const settings = siteMetadataToHeaderSettings(metadata);
        siteLineageLog(LOG_LABEL, 'resolved settings', settings);
        return settings;
    } catch (error) {
        siteLineageLog(LOG_LABEL, 'failed to resolve', {error});
        if (!isEdgeRuntime(info)) {
            return preview;
        }
        return DEFAULT_SETTINGS;
    }
}
