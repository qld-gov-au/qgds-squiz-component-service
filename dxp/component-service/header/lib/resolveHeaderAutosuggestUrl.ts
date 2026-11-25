import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types.js';
import {isLocalDevRuntime} from './localDevRuntime.js';
import type {HeaderSiteSearch} from './types.js';

function readComponentEnvString(info?: DxpComponentInfo, key?: string): string {
    if (!key) {
        return '';
    }

    const sources = [info?.env, info?.environment, info?.set?.env, info?.set?.environment];

    for (const source of sources) {
        if (!source || typeof source !== 'object') {
            continue;
        }
        const value = String((source as Record<string, unknown>)[key] ?? '').trim();
        if (value) {
            return value;
        }
    }

    try {
        if (typeof process !== 'undefined' && process.env) {
            return String(process.env[key] ?? '').trim();
        }
    } catch {
        // Edge may restrict process access.
    }

    return '';
}

/** Funnelback suggest base URL for `data-suggestions` (local proxy URL when in dev). */
export function resolveHeaderAutosuggestUrl(siteSearch?: HeaderSiteSearch, info?: DxpComponentInfo): string {
    if (isLocalDevRuntime(info)) {
        const localUrl = readComponentEnvString(info, 'LOCAL_FUNNELBACK_SUGGEST_URL');
        if (localUrl) {
            return localUrl;
        }
    }

    return siteSearch?.autosuggestUrl?.trim() || '';
}
