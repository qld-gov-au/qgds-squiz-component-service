import {resolveComponentEnv} from '../pageUrl/index.js';
import type {DxpComponentInfo} from '../siteLineage/types.js';
import {isEdgeRuntime} from '../siteLineage/fetchSiteLineage.js';
import {resolveAmapiCacheTtlMs} from './amapiResponseCache.js';
import type {ContentApiAmapiProxyConfig} from './types.js';

const AMAPI_TOKEN_ENV_KEYS = ['AMAPI_TOKEN', 'VITE_AMAPI_TOKEN', 'ASSET_MANAGEMENT_BEARER_TOKEN'] as const;

function pickEnvString(env: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
        const value = String(env[key] ?? '').trim();
        if (value) return value;
    }
    return '';
}

function readComponentEnvRecord(info?: DxpComponentInfo): Record<string, unknown> {
    const candidates = [info?.environment, info?.set?.env, info?.set?.environment, info?.env].filter((value) => value && typeof value === 'object');
    return Object.assign({}, ...candidates) as unknown as Record<string, unknown>;
}

function pickAmapiTokenFromRecord(env: Record<string, unknown>): string | null {
    const token = pickEnvString(env, ...AMAPI_TOKEN_ENV_KEYS);
    return token.length > 0 ? token : null;
}

function matrixOriginFromBaseDomain(baseDomain: string): string | null {
    const origin = baseDomain.trim();
    if (!origin) return null;
    try {
        const parsed = new URL(origin.startsWith('http') ? origin : `https://${origin}`);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed.origin;
    } catch {
        return null;
    }
}

/** AMAPI bearer token from local dev env (never used on Edge). */
export function resolveLocalAmapiToken(): string | null {
    const token = process.env.AMAPI_TOKEN?.trim() || process.env.VITE_AMAPI_TOKEN?.trim() || process.env.ASSET_MANAGEMENT_BEARER_TOKEN?.trim() || '';
    return token.length > 0 ? token : null;
}

/** Matrix instance origin for AMAPI requests (Node `process.env` only). */
export function resolveLocalMatrixOrigin(): string | null {
    const baseDomain = process.env.BASE_DOMAIN?.trim() || process.env.BASE_URL?.trim() || '';
    return matrixOriginFromBaseDomain(baseDomain);
}

function resolveCacheTtlMsForInfo(info?: DxpComponentInfo): number {
    const explicit = readComponentEnvRecord(info);
    const merged = {
        ...(resolveComponentEnv(info) as unknown as Record<string, unknown>),
        ...explicit,
    };
    if (String(merged.AMAPI_CACHE_TTL_WEEKS ?? '').trim()) {
        return resolveAmapiCacheTtlMs(merged);
    }
    if (typeof process !== 'undefined' && process.env && String(process.env.AMAPI_CACHE_TTL_WEEKS ?? '').trim()) {
        return resolveAmapiCacheTtlMs(process.env as unknown as unknown as Record<string, unknown>);
    }
    return resolveAmapiCacheTtlMs(merged);
}

function withCacheTtl(config: ContentApiAmapiProxyConfig, info?: DxpComponentInfo): ContentApiAmapiProxyConfig {
    return {
        ...config,
        cacheTtlMs: resolveCacheTtlMsForInfo(info),
    };
}

export function resolveLocalAmapiConfig(): ContentApiAmapiProxyConfig | null {
    const token = resolveLocalAmapiToken();
    const matrixOrigin = resolveLocalMatrixOrigin();
    if (!token || !matrixOrigin) {
        return null;
    }

    return withCacheTtl({
        token,
        matrixOrigin,
        fetchImpl: globalThis.fetch,
    });
}

/** AMAPI proxy config from component-set env (Edge / Miniflare safe — no `process.env`). */
export function resolveAmapiConfigFromInfo(info?: DxpComponentInfo): ContentApiAmapiProxyConfig | null {
    const explicit = readComponentEnvRecord(info);
    const merged = resolveComponentEnv(info);
    const token = pickAmapiTokenFromRecord(explicit) || pickAmapiTokenFromRecord(merged as unknown as Record<string, unknown>);
    const baseDomain = pickEnvString(merged as unknown as Record<string, unknown>, 'BASE_DOMAIN', 'BASE_URL');
    const matrixOrigin = matrixOriginFromBaseDomain(baseDomain);
    if (!token || !matrixOrigin) {
        return null;
    }

    return withCacheTtl(
        {
            token,
            matrixOrigin,
            fetchImpl: globalThis.fetch,
        },
        info,
    );
}

/** True when AMAPI-backed Content API fetch should be used (local Node or dev-ui `info.env`). */
export function shouldUseLocalAmapiProxy(info?: DxpComponentInfo): boolean {
    if (resolveAmapiConfigFromInfo(info)) {
        return true;
    }
    if (isEdgeRuntime(info)) {
        return false;
    }
    // DXP dev-ui passes `info.fns`; Node `process.env` AMAPI must not run there without `info.env`.
    if (info?.fns && typeof info.fns === 'object') {
        return false;
    }
    return Boolean(resolveLocalAmapiConfig());
}

/** AMAPI proxy config from component env (dev-ui) or local Node `process.env`. */
export function resolveAmapiProxyConfig(info?: DxpComponentInfo): ContentApiAmapiProxyConfig | null {
    const fromInfo = resolveAmapiConfigFromInfo(info);
    if (fromInfo) {
        return fromInfo;
    }
    if (!shouldUseLocalAmapiProxy(info)) {
        return null;
    }
    return resolveLocalAmapiConfig();
}
