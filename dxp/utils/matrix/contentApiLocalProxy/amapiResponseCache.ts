export const DEFAULT_AMAPI_CACHE_TTL_WEEKS = 2;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export interface AmapiCacheEntry {
    status: number;
    bodyText: string;
    contentType: string;
    cachedAt: number;
}

const amapiPathCache = new Map<string, AmapiCacheEntry>();
const contentApiUrlCache = new Map<string, AmapiCacheEntry>();

/** Parse `AMAPI_CACHE_TTL_WEEKS` from component/env record. `0` disables caching. */
export function resolveAmapiCacheTtlMs(env: Record<string, unknown> = {}): number {
    const raw = String(env.AMAPI_CACHE_TTL_WEEKS ?? '').trim();
    if (!raw) {
        return DEFAULT_AMAPI_CACHE_TTL_WEEKS * MS_PER_WEEK;
    }

    const weeks = Number.parseFloat(raw);
    if (!Number.isFinite(weeks) || weeks <= 0) {
        return 0;
    }

    return weeks * MS_PER_WEEK;
}

export function isAmapiCacheEnabled(cacheTtlMs: number | undefined): boolean {
    return typeof cacheTtlMs === 'number' && cacheTtlMs > 0;
}

function isEntryFresh(entry: AmapiCacheEntry, cacheTtlMs: number): boolean {
    return Date.now() - entry.cachedAt < cacheTtlMs;
}

export function buildAmapiPathCacheKey(matrixOrigin: string, path: string): string {
    const origin = matrixOrigin.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}::${normalizedPath}`;
}

export function buildContentApiUrlCacheKey(requestUrl: string): string {
    try {
        const url = new URL(requestUrl);
        url.hash = '';
        return url.href;
    } catch {
        return requestUrl;
    }
}

export function readAmapiPathCache(key: string, cacheTtlMs: number): AmapiCacheEntry | null {
    const entry = amapiPathCache.get(key);
    if (!entry) return null;
    if (!isEntryFresh(entry, cacheTtlMs)) {
        amapiPathCache.delete(key);
        return null;
    }
    return entry;
}

export function writeAmapiPathCache(key: string, entry: AmapiCacheEntry): void {
    amapiPathCache.set(key, entry);
}

export function readContentApiUrlCache(key: string, cacheTtlMs: number): AmapiCacheEntry | null {
    const entry = contentApiUrlCache.get(key);
    if (!entry) return null;
    if (!isEntryFresh(entry, cacheTtlMs)) {
        contentApiUrlCache.delete(key);
        return null;
    }
    return entry;
}

export function writeContentApiUrlCache(key: string, entry: AmapiCacheEntry): void {
    contentApiUrlCache.set(key, entry);
}

export function responseFromCacheEntry(entry: AmapiCacheEntry): Response {
    return new Response(entry.bodyText, {
        status: entry.status,
        headers: entry.contentType ? {'Content-Type': entry.contentType} : undefined,
    });
}

export async function cacheEntryFromResponse(response: Response): Promise<AmapiCacheEntry | null> {
    const bodyText = await response.text();
    const contentType = response.headers.get('Content-Type') ?? 'application/json';
    return {
        status: response.status,
        bodyText,
        contentType,
        cachedAt: Date.now(),
    };
}

/** Vitest only — clears module singleton caches between tests. */
export function clearAmapiInMemoryCachesForTests(): void {
    amapiPathCache.clear();
    contentApiUrlCache.clear();
}
