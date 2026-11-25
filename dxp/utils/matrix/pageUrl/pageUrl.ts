import type {PageUrlComponentInfo, ResolvedComponentEnv} from './types.js';

const LOCAL_DEV_BASE_URL = 'https://tgh1-web.matrix.squiz.cloud';

function envString(key: string, fallback: string): string {
    try {
        if (typeof process === 'undefined' || !process.env) {
            return fallback;
        }
        const value = String(process.env[key] ?? '').trim();
        return value || fallback;
    } catch {
        return fallback;
    }
}

/** Matrix staging origin (site content may live under a subdirectory mount). */
export const MATRIX_REBUILD_DEV_ORIGIN = envString('VITE_MATRIX_STAGING_ORIGIN', 'https://staging-web.matrix.squiz.cloud');

/** Default site mount path when BASE_DOMAIN is Matrix staging origin-only. */
export const DEFAULT_MATRIX_REBUILD_SITE_MOUNT = envString('VITE_MATRIX_SITE_MOUNT', '/site-mount');

export function normalizePageUrl(value: unknown): string {
    if (value == null) {
        return '';
    }
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'object') {
        const record = value as {href?: string};
        if (typeof record.href === 'string') {
            return record.href.trim();
        }
        const coerced = String(value);
        if (coerced && coerced !== '[object Object]') {
            return coerced.trim();
        }
    }
    return '';
}

function parseAbsoluteOrRelativePageUrl(value: unknown): string | null {
    const raw = normalizePageUrl(value);
    if (!raw) return null;

    try {
        if (raw.startsWith('//')) {
            return new URL(`https:${raw}`).href;
        }
        if (raw.startsWith('/')) {
            return new URL(`https://placeholder.invalid${raw}`).href;
        }
        return new URL(raw).href;
    } catch {
        return null;
    }
}

function originFromPageUrl(value: unknown): string | null {
    const parsed = parseAbsoluteOrRelativePageUrl(value);
    if (!parsed) return null;

    try {
        return new URL(parsed).origin;
    } catch {
        return null;
    }
}

/** Matrix subdirectory site mounts (e.g. staging site under `/site-mount`). */
export function siteBaseUrlFromPageUrl(pageUrl: unknown): string | null {
    const parsed = parseAbsoluteOrRelativePageUrl(pageUrl);
    if (!parsed) return null;

    try {
        const url = new URL(parsed);
        const segments = url.pathname.split('/').filter(Boolean);
        const mountSegment = DEFAULT_MATRIX_REBUILD_SITE_MOUNT.replace(/^\//, '');
        const siteMountSegments = new Set(mountSegment ? [mountSegment] : []);

        if (segments.length > 0 && siteMountSegments.has(segments[0])) {
            return `${url.origin}/${segments[0]}`;
        }

        return url.origin;
    } catch {
        return null;
    }
}

/** Component-set environment variables (edge or server context). */
export function resolveComponentEnv(info?: PageUrlComponentInfo): ResolvedComponentEnv {
    const derivedFromPageUrl = deriveEnvFromPageUrl(info);
    const processEnv = readProcessEnv();
    const componentCandidates = [derivedFromPageUrl, info?.environment, info?.set?.env, info?.set?.environment, info?.env].filter((value) => value && typeof value === 'object');

    const env = mergeWithProcessFallback(Object.assign({}, ...componentCandidates) as Record<string, unknown>, processEnv);
    applyBaseUrlEnvMapping(env);

    return {
        API_IDENTIFIER: pickEnvString(env, 'API_IDENTIFIER'),
        BASE_DOMAIN: pickEnvString(env, 'BASE_DOMAIN').replace(/\/$/, ''),
        BASE_PATH: pickEnvString(env, 'BASE_PATH'),
        API_SITE_LINEAGE_PATH: pickEnvString(env, 'API_SITE_LINEAGE_PATH') || '/site-lineage',
        API_HOME_PATHS: pickEnvString(env, 'API_HOME_PATHS'),
        MX_API: pickEnvString(env, 'MX_API').replace(/\/$/, ''),
        BEARER_AUTH: resolveBearerAuth(env),
    };
}

/** Fill unset auth/API keys from process.env without overriding explicit component-set values. */
function mergeWithProcessFallback(componentEnv: Record<string, unknown>, processEnv: Record<string, unknown>): Record<string, unknown> {
    const merged = {...componentEnv};
    const fallbackKeys = ['API_IDENTIFIER', 'BASE_DOMAIN', 'BASE_PATH', 'BASE_URL', 'SITE_ROOT_ASSET_ID', 'MX_API', ...BEARER_ENV_KEYS];

    for (const key of fallbackKeys) {
        if (!String(merged[key] ?? '').trim()) {
            const value = String(processEnv[key] ?? '').trim();
            if (value) {
                merged[key] = value;
            }
        }
    }

    return merged;
}

/** Map repo `BASE_URL` into `BASE_DOMAIN` / `MX_API` when those are unset. */
function applyBaseUrlEnvMapping(env: Record<string, unknown>): void {
    if (pickEnvString(env, 'BASE_DOMAIN')) {
        return;
    }

    const baseUrl = pickEnvString(env, 'BASE_URL');
    if (!baseUrl) {
        return;
    }

    try {
        const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
        const path = url.pathname.replace(/\/$/, '');
        env.BASE_DOMAIN = path ? `${url.origin}${path}` : url.origin;
        if (!pickEnvString(env, 'MX_API')) {
            env.MX_API = `${url.origin}/__api`;
        }
    } catch {
        // ignore invalid BASE_URL
    }
}

function hasExplicitMatrixApiEnv(explicit: Record<string, unknown>, processEnv: Record<string, unknown>): boolean {
    const keys = ['MX_API', 'BASE_DOMAIN', 'BASE_URL'];
    for (const key of keys) {
        if (pickEnvString(explicit, key) || pickEnvString(processEnv, key)) {
            return true;
        }
    }
    return false;
}

const BEARER_ENV_KEYS = ['BEARER_AUTH', 'BEARER', 'BEARER_TOKEN', 'CONTENT_API_TOKEN', 'API_KEY', 'API_TOKEN', 'ASSET_MANAGEMENT_BEARER_TOKEN'] as const;

function pickEnvString(env: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
        const value = String(env[key] ?? '').trim();
        if (value) return value;
    }
    return '';
}

function resolveBearerAuth(env: Record<string, unknown>): string {
    for (const key of BEARER_ENV_KEYS) {
        const value = String(env[key] ?? '')
            .trim()
            .replace(/^Bearer\s+/i, '');
        if (value) return value;
    }
    return '';
}

function readProcessEnv(): Record<string, unknown> {
    try {
        if (typeof process !== 'undefined' && process.env && typeof process.env === 'object') {
            return process.env as Record<string, unknown>;
        }
    } catch {
        // Edge runtimes may restrict process access.
    }

    return {};
}

function readExplicitComponentEnv(info?: PageUrlComponentInfo): Record<string, unknown> {
    const candidates = [info?.environment, info?.set?.env, info?.set?.environment, info?.env].filter((value) => value && typeof value === 'object');

    return Object.assign({}, ...candidates) as Record<string, unknown>;
}

/** Infer Content API base URL from the placement page origin when MX_API is unset. */
function deriveEnvFromPageUrl(info?: PageUrlComponentInfo): Record<string, string> {
    const explicit = readExplicitComponentEnv(info);
    const processEnv = readProcessEnv();
    if (hasExplicitMatrixApiEnv(explicit, processEnv)) {
        return {};
    }

    const origin = originFromPageUrl(resolveCtxPageUrl(info));
    const derived: Record<string, string> = {};

    if (origin) {
        derived.MX_API = `${origin}/__api`;
    }

    return derived;
}

export function resolveContentApiAuthHeaders(info?: PageUrlComponentInfo): Record<string, string> {
    const {BEARER_AUTH} = resolveComponentEnv(info);
    if (!BEARER_AUTH) {
        return {};
    }

    return {Authorization: `Bearer ${BEARER_AUTH}`};
}

/** Matrix service base for PI proxy fetches: `${BASE_DOMAIN}${BASE_PATH}`. */
export function resolveMatrixServiceBase(info?: PageUrlComponentInfo): string {
    const {BASE_DOMAIN, BASE_PATH} = resolveComponentEnv(info);
    if (!BASE_DOMAIN || !BASE_PATH) {
        return '';
    }

    const path = BASE_PATH.startsWith('/') ? BASE_PATH : `/${BASE_PATH}`;
    return `${BASE_DOMAIN}${path}`.replace(/\/$/, '');
}

export function formatMatrixUriToId(assetUri: string, apiIdentifier: string): string {
    if (typeof assetUri !== 'string' || !apiIdentifier) {
        return '';
    }
    return assetUri.replace(`matrix-asset://${apiIdentifier}/`, '');
}

/**
 * Ensure Content API `base_url` includes the Matrix staging site mount.
 * Origin-only values (e.g. `https://staging-web.matrix.squiz.cloud`) do not match
 * asset URLs under the configured mount, so Content API returns empty `url`/`urls`.
 */
export function ensureMatrixRebuildSiteMount(base: string): string {
    const normalized = String(base ?? '')
        .trim()
        .replace(/\/$/, '');
    if (!normalized) return '';

    try {
        const url = new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`);
        if (url.origin !== MATRIX_REBUILD_DEV_ORIGIN) {
            return normalized;
        }

        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
            return `${url.origin}/${segments.join('/')}`;
        }

        return `${url.origin}${DEFAULT_MATRIX_REBUILD_SITE_MOUNT}`;
    } catch {
        return normalized;
    }
}

/** Content API `base_url` query parameter — site root used to resolve asset URLs. */
export function resolveContentApiUrlResolutionBase(info?: PageUrlComponentInfo): string {
    const {BASE_DOMAIN, MX_API} = resolveComponentEnv(info);
    if (BASE_DOMAIN) {
        return ensureMatrixRebuildSiteMount(BASE_DOMAIN);
    }

    const pageUrl = resolveCtxPageUrl(info);
    const fromPage = siteBaseUrlFromPageUrl(pageUrl) ?? originFromPageUrl(pageUrl) ?? '';
    if (fromPage) {
        return ensureMatrixRebuildSiteMount(fromPage);
    }

    if (MX_API.endsWith('/__api')) {
        return ensureMatrixRebuildSiteMount(MX_API.slice(0, -'/__api'.length));
    }

    return '';
}

/** Origin for Matrix edge fetches from the current page URL (e.g. `info.ctx.url`). */
export function getBaseUrl(currentPageUrl: unknown): string {
    return originFromPageUrl(currentPageUrl) ?? LOCAL_DEV_BASE_URL;
}

/** Matrix web origin for `/services/mx/*` edge fetches (SSR cannot use relative URLs). */
export function resolveMxChildrenAssetsBaseUrl(currentPageUrl?: unknown): string {
    const fromPage = originFromPageUrl(currentPageUrl);
    if (fromPage) {
        return fromPage;
    }

    const fromEnv = (process.env.BASE_DOMAIN || process.env.BASE_URL || '').trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, '');
    }
    return LOCAL_DEV_BASE_URL;
}

/** Resolve the Matrix asset ID for the page the component is placed on. */
export function resolveCtxAssetId(info?: PageUrlComponentInfo): string {
    const ctx = info?.ctx;
    const candidates: unknown[] = [];

    if (ctx && typeof ctx === 'object') {
        candidates.push(ctx.assetId, ctx.parentAssetId, ctx.pageAssetId);
    }

    candidates.push(info?.assetId);

    for (const candidate of candidates) {
        if (candidate == null) continue;
        const id = String(candidate).trim();
        if (id) return id;
    }

    return '';
}

/** Resolve the Content API base URL from component-set env or the current page origin. */
export function resolveContentApiBase(info?: PageUrlComponentInfo): string {
    const {MX_API} = resolveComponentEnv(info);
    if (MX_API) return MX_API;

    const pageUrl = resolveCtxPageUrl(info);
    const origin = originFromPageUrl(pageUrl);
    if (origin) {
        return `${origin}/__api`;
    }

    return '';
}

/** True when Content API base is an absolute http(s) URL (required for Miniflare `fetch`). */
export function hasAbsoluteHttpContentApiBase(info?: PageUrlComponentInfo): boolean {
    const base = String(resolveContentApiBase(info) ?? '').trim();
    if (!base || base.startsWith('/')) {
        return false;
    }

    try {
        const parsed = new URL(base.includes('://') ? base : `https://${base}`);
        return Boolean(parsed.hostname) && (parsed.protocol === 'http:' || parsed.protocol === 'https:');
    } catch {
        return false;
    }
}

function assertAbsoluteFetchUrl(endpoint: string, label: string): void {
    const requestUrl = String(endpoint ?? '').trim();
    if (!requestUrl) {
        throw new Error(`${label}: request URL is empty`);
    }
    try {
        const parsed = new URL(requestUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error(`${label}: request URL must be http(s)`);
        }
    } catch {
        throw new Error(`${label}: request URL is invalid: ${JSON.stringify(requestUrl)}`);
    }
}

/** @internal Used by site lineage fetch helpers before Miniflare `fetch`. */
export function assertContentApiFetchUrl(endpoint: string, label = 'Content API'): void {
    assertAbsoluteFetchUrl(endpoint, label);
}

export function resolveCtxPageUrl(info?: PageUrlComponentInfo): string {
    const ctx = info?.ctx;
    if (typeof ctx === 'string') {
        return normalizePageUrl(ctx);
    }
    if (!ctx || typeof ctx !== 'object') {
        return normalizePageUrl(info?.url);
    }
    return normalizePageUrl(ctx.url) || normalizePageUrl(ctx.href) || normalizePageUrl(ctx.canonicalUrl) || normalizePageUrl(ctx.pageUrl) || normalizePageUrl(info?.url) || '';
}

export const LOCAL_DEV_MX_CHILDREN_ASSETS_BASE_URL = LOCAL_DEV_BASE_URL;
