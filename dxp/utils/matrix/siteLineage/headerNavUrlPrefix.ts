import {shouldUseLocalAmapiProxy} from '../contentApiLocalProxy/index.js';
import {
    DEFAULT_MATRIX_REBUILD_SITE_MOUNT,
    MATRIX_REBUILD_DEV_ORIGIN,
    resolveComponentEnv,
    resolveContentApiUrlResolutionBase,
    resolveCtxPageUrl,
    siteBaseUrlFromPageUrl,
} from '../pageUrl/index.js';
import type {PageUrlComponentInfo} from '../pageUrl/types.js';
import {normalizeNavigationUrl} from './siteLineageToSectionNav.js';
import type {SectionNavigationItem} from './types.js';

function isMatrixRebuildDevHost(value: string | undefined): boolean {
    return String(value ?? '').includes(MATRIX_REBUILD_DEV_ORIGIN);
}

function isTruthyEnvFlag(value: unknown): boolean {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function isLocalBoilerplateMxApi(value: unknown): boolean {
    const normalized = String(value ?? '').trim();
    return normalized.includes('localhost:4000');
}

/** Local cut-up dev (`IS_LOCAL=true` in cmp / .env) — no Matrix rebuild mount prefix. */
export function isLocalCutUpEnv(info?: PageUrlComponentInfo): boolean {
    try {
        if (shouldUseLocalAmapiProxy(info)) {
            return true;
        }

        const processEnv = typeof process !== 'undefined' && process.env ? process.env : {};

        const mxApiCandidates = [info?.env?.MX_API, info?.environment?.MX_API, info?.set?.env?.MX_API, info?.set?.environment?.MX_API, processEnv.MX_API];

        if (mxApiCandidates.some(isLocalBoilerplateMxApi)) {
            return true;
        }

        return isTruthyEnvFlag(processEnv.IS_LOCAL);
    } catch {
        return false;
    }
}

function mountPathFromBaseUrl(value: string | undefined): string | null {
    const normalized = String(value ?? '')
        .trim()
        .replace(/\/$/, '');
    if (!normalized) return null;

    try {
        const url = new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length === 0) return null;
        return `/${segments.join('/')}`;
    } catch {
        return null;
    }
}

/** @deprecated Use resolveHeaderNavUrlPrefix(info) */
export function resolveMatrixDevHeaderNavUrlPrefix(baseDomain: string | undefined): string | null {
    if (!isMatrixRebuildDevHost(baseDomain)) {
        return null;
    }

    return mountPathFromBaseUrl(baseDomain) ?? DEFAULT_MATRIX_REBUILD_SITE_MOUNT;
}

/** Site mount path for Matrix staging header links (e.g. `/site-mount`). */
export function resolveHeaderNavUrlPrefix(info?: PageUrlComponentInfo): string | null {
    if (isLocalCutUpEnv(info)) {
        return null;
    }

    const env = resolveComponentEnv(info);
    const pageUrl = resolveCtxPageUrl(info);
    const candidates = [env.BASE_DOMAIN, resolveContentApiUrlResolutionBase(info), siteBaseUrlFromPageUrl(pageUrl) ?? undefined];

    if (!candidates.some(isMatrixRebuildDevHost)) {
        return null;
    }

    for (const candidate of candidates) {
        const mountPath = mountPathFromBaseUrl(candidate);
        if (mountPath) {
            return mountPath;
        }
    }

    return DEFAULT_MATRIX_REBUILD_SITE_MOUNT;
}

/** Logo home URL for the header — matrix dev site mount path or `/` on production. */
export function resolveHeaderHomeUrl(info?: PageUrlComponentInfo): string {
    if (isLocalCutUpEnv(info)) {
        return '/';
    }

    const env = resolveComponentEnv(info);
    const baseDomain = env.BASE_DOMAIN.replace(/\/$/, '');

    if (!baseDomain || !isMatrixRebuildDevHost(baseDomain)) {
        return '/';
    }

    const existingMount = mountPathFromBaseUrl(baseDomain);
    if (existingMount) {
        return existingMount;
    }

    const prefix = resolveHeaderNavUrlPrefix(info);
    return prefix ? normalizeNavigationUrl(prefix) : DEFAULT_MATRIX_REBUILD_SITE_MOUNT;
}

export function prependHeaderNavUrlPrefix(url: string, prefix: string): string {
    const normalized = normalizeNavigationUrl(url);
    const mountPath = normalizeNavigationUrl(prefix);
    if (!normalized || !mountPath) return normalized;

    if (normalized === mountPath || normalized.startsWith(`${mountPath}/`)) {
        return normalized;
    }

    if (normalized === '/') {
        return mountPath;
    }

    const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${mountPath}${path}`;
}

/** Apply Matrix staging mount prefix to header navigation URLs. */
export function applyHeaderNavUrlPrefix(items: SectionNavigationItem[], prefix: string | null): SectionNavigationItem[] {
    if (!prefix || !Array.isArray(items)) return items;

    return items.map((item) => {
        const next: SectionNavigationItem = {
            ...item,
            url: prependHeaderNavUrlPrefix(item.url, prefix),
        };

        if (Array.isArray(item.children) && item.children.length > 0) {
            next.children = applyHeaderNavUrlPrefix(item.children, prefix);
        }

        return next;
    });
}
