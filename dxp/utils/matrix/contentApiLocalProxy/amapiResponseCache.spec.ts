import {afterEach, describe, expect, it, vi} from 'vitest';
import {DEFAULT_AMAPI_CACHE_TTL_WEEKS, clearAmapiInMemoryCachesForTests, resolveAmapiCacheTtlMs} from './amapiResponseCache.js';

describe('resolveAmapiCacheTtlMs', () => {
    afterEach(() => {
        clearAmapiInMemoryCachesForTests();
    });

    it('defaults to two weeks when env is empty', () => {
        const ms = resolveAmapiCacheTtlMs({});
        expect(ms).toBe(DEFAULT_AMAPI_CACHE_TTL_WEEKS * 7 * 24 * 60 * 60 * 1000);
    });

    it('parses AMAPI_CACHE_TTL_WEEKS from env', () => {
        expect(resolveAmapiCacheTtlMs({AMAPI_CACHE_TTL_WEEKS: '4'})).toBe(4 * 7 * 24 * 60 * 60 * 1000);
    });

    it('returns 0 when weeks is 0 (cache disabled)', () => {
        expect(resolveAmapiCacheTtlMs({AMAPI_CACHE_TTL_WEEKS: '0'})).toBe(0);
    });
});

describe('amapi path cache expiry', () => {
    afterEach(() => {
        vi.useRealTimers();
        clearAmapiInMemoryCachesForTests();
    });

    it('drops stale entries after TTL', async () => {
        vi.useFakeTimers();
        const {createAmapiFetch} = await import('./createAmapiFetch.js');
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({id: '1'}), {
                status: 200,
                headers: {'Content-Type': 'application/json'},
            }),
        );

        const amapiFetch = createAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 't',
            fetchImpl,
            cacheTtlMs: 1000,
        });

        await amapiFetch('/assets/1');
        await amapiFetch('/assets/1');
        expect(fetchImpl).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1001);

        await amapiFetch('/assets/1');
        expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
});
