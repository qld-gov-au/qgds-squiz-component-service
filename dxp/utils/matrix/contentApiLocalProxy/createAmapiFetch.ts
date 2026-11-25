import {buildAmapiPathCacheKey, cacheEntryFromResponse, isAmapiCacheEnabled, readAmapiPathCache, responseFromCacheEntry, writeAmapiPathCache} from './amapiResponseCache.js';
import type {AmapiFetch, ContentApiAmapiProxyConfig} from './types.js';

const AMAPI_PREFIX = '/__management_api/v1';

export function createAmapiFetch(config: ContentApiAmapiProxyConfig): AmapiFetch {
    const matrixOrigin = config.matrixOrigin.replace(/\/$/, '');
    const token = config.token.trim();
    const fetchImpl = config.fetchImpl ?? globalThis.fetch;
    const cacheTtlMs = config.cacheTtlMs;
    const cacheEnabled = isAmapiCacheEnabled(cacheTtlMs);

    return async (path: string, init?: RequestInit) => {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = new URL(`${AMAPI_PREFIX}${normalizedPath}`, `${matrixOrigin}/`);

        const method = String(init?.method ?? 'GET').toUpperCase();

        if (cacheEnabled && method === 'GET') {
            const cacheKey = buildAmapiPathCacheKey(matrixOrigin, normalizedPath);
            const cached = readAmapiPathCache(cacheKey, cacheTtlMs!);
            if (cached) {
                return responseFromCacheEntry(cached);
            }
        }

        const headers: Record<string, string> = {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        };
        // Matrix AMAPI rejects some GETs when Content-Type is set without a body (422).
        if (method !== 'GET' && method !== 'HEAD') {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetchImpl(url.toString(), {
            ...init,
            method,
            headers: {
                ...headers,
                ...(init?.headers as Record<string, string> | undefined),
            },
        });

        if (cacheEnabled && method === 'GET' && response.ok) {
            const entry = await cacheEntryFromResponse(response.clone());
            if (entry) {
                writeAmapiPathCache(buildAmapiPathCacheKey(matrixOrigin, normalizedPath), entry);
            }
        }

        return response;
    };
}
