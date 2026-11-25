import {createAmapiFetch} from './createAmapiFetch.js';
import {handleContentApiAmapiRequest} from './handleContentApiAmapiRequest.js';
import {
    buildContentApiUrlCacheKey,
    cacheEntryFromResponse,
    isAmapiCacheEnabled,
    readContentApiUrlCache,
    responseFromCacheEntry,
    writeContentApiUrlCache,
} from './amapiResponseCache.js';
import type {ContentApiAmapiProxyConfig} from './types.js';

/** `fetch` wrapper that serves Content API asset routes from AMAPI in local dev. */
export function createContentApiAmapiFetch(config: ContentApiAmapiProxyConfig): typeof fetch {
    const amapiFetch = createAmapiFetch(config);
    const fallbackFetch = config.fetchImpl ?? globalThis.fetch;
    const cacheTtlMs = config.cacheTtlMs;
    const cacheEnabled = isAmapiCacheEnabled(cacheTtlMs);

    const proxyFetch: typeof fetch = async (input, init) => {
        const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        const method = String(init?.method ?? 'GET').toUpperCase();
        const contentApiCacheKey = buildContentApiUrlCacheKey(requestUrl);

        if (cacheEnabled && method === 'GET') {
            const cached = readContentApiUrlCache(contentApiCacheKey, cacheTtlMs!);
            if (cached) {
                return responseFromCacheEntry(cached);
            }
        }

        const proxied = await handleContentApiAmapiRequest(requestUrl, {
            amapiFetch,
        });
        if (proxied) {
            if (cacheEnabled && method === 'GET' && proxied.ok) {
                const entry = await cacheEntryFromResponse(proxied.clone());
                if (entry) {
                    writeContentApiUrlCache(contentApiCacheKey, entry);
                }
            }
            return proxied;
        }

        return fallbackFetch(input as RequestInfo | URL, init);
    };

    return proxyFetch;
}
