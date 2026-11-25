import {createContentApiAmapiFetch} from './createContentApiAmapiFetch.js';
import {resolveAmapiProxyConfig} from './resolveLocalAmapiConfig.js';
import {resolveComponentEnv} from '../pageUrl/index.js';
import type {DxpComponentInfo} from '../siteLineage/types.js';

function readComponentEnvRecord(info?: DxpComponentInfo): Record<string, unknown> {
    const candidates = [info?.environment, info?.set?.env, info?.set?.environment, info?.env].filter((value) => value && typeof value === 'object');
    return Object.assign({}, ...candidates) as unknown as Record<string, unknown>;
}

/** True when dev-ui should call localhost `__api` (Node proxy + disk cache) instead of in-worker AMAPI synthesis. */
export function shouldUseLocalHttpAmapiProxy(info?: DxpComponentInfo): boolean {
    const explicit = readComponentEnvRecord(info);
    const merged = {
        ...(resolveComponentEnv(info) as unknown as Record<string, unknown>),
        ...explicit,
    };
    if (String(merged.AMAPI_DISK_CACHE ?? '').trim() !== '1') {
        return false;
    }
    const mxApi = String(merged.MX_API ?? '').trim();
    return mxApi.includes('localhost:4000');
}

/**
 * Fetch for lineage when local AMAPI proxy is configured.
 * Uses HTTP to localhost `__api` when disk cache proxy is enabled; otherwise in-worker synthesis.
 */
export function resolveLineageContentApiFetchImpl(info?: DxpComponentInfo): typeof fetch | undefined {
    const amapiConfig = resolveAmapiProxyConfig(info);
    if (!amapiConfig) {
        return undefined;
    }
    if (shouldUseLocalHttpAmapiProxy(info)) {
        // Do not return `globalThis.fetch` bare — Miniflare/workerd throws "Illegal invocation".
        return (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init);
    }
    return createContentApiAmapiFetch(amapiConfig);
}
