import type {DxpComponentInfo} from './types.js';

/** Default Matrix site root asset ID (Arts QLD delivery line; override via env or author input). */
export const DEFAULT_SITE_ROOT_ASSET_ID = '465';

/** @deprecated Use `DEFAULT_SITE_ROOT_ASSET_ID` or `resolveSiteRootAssetId`. */
export const SITE_ROOT_ASSET_ID = DEFAULT_SITE_ROOT_ASSET_ID;

export interface ResolveSiteRootAssetIdOptions {
    /** Author override from header `siteRootAssetId` manifest field. */
    override?: string;
}

function pickSiteRootIdCandidate(value: unknown): string {
    const id = String(value ?? '').trim();
    return /^\d+$/.test(id) ? id : '';
}

function readSiteRootFromInfo(info?: DxpComponentInfo): string {
    const sources = [info?.env?.SITE_ROOT_ASSET_ID, info?.environment?.SITE_ROOT_ASSET_ID, info?.set?.env?.SITE_ROOT_ASSET_ID, info?.set?.environment?.SITE_ROOT_ASSET_ID];

    for (const candidate of sources) {
        const id = pickSiteRootIdCandidate(candidate);
        if (id) {
            return id;
        }
    }

    return '';
}

export function resolveSiteRootAssetId(info?: DxpComponentInfo, options: ResolveSiteRootAssetIdOptions = {}): string {
    const fromOverride = pickSiteRootIdCandidate(options.override);
    if (fromOverride) {
        return fromOverride;
    }

    const fromInfo = readSiteRootFromInfo(info);
    if (fromInfo) {
        return fromInfo;
    }

    try {
        if (typeof process !== 'undefined' && process.env) {
            const fromProcess = pickSiteRootIdCandidate(process.env.SITE_ROOT_ASSET_ID);
            if (fromProcess) {
                return fromProcess;
            }
        }
    } catch {
        // Edge may restrict process access.
    }

    return DEFAULT_SITE_ROOT_ASSET_ID;
}
