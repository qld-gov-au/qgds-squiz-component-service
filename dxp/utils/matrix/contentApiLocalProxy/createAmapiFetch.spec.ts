import {afterEach, describe, expect, it, vi} from 'vitest';
import {clearAmapiInMemoryCachesForTests} from './amapiResponseCache.js';
import {createAmapiFetch} from './createAmapiFetch.js';

describe('createAmapiFetch', () => {
    afterEach(() => {
        clearAmapiInMemoryCachesForTests();
    });

    it('caches successful GET responses when cacheTtlMs is set', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({id: '1354'}), {
                status: 200,
                headers: {'Content-Type': 'application/json'},
            }),
        );

        const amapiFetch = createAmapiFetch({
            matrixOrigin: 'https://www.arts.qld.gov.au',
            token: 'test-token',
            fetchImpl,
            cacheTtlMs: 60_000,
        });

        await amapiFetch('/assets/1354');
        await amapiFetch('/assets/1354');

        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('does not cache when cacheTtlMs is 0', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({id: '1'}), {status: 200}));

        const amapiFetch = createAmapiFetch({
            matrixOrigin: 'https://www.arts.qld.gov.au',
            token: 'test-token',
            fetchImpl,
            cacheTtlMs: 0,
        });

        await amapiFetch('/assets/1');
        await amapiFetch('/assets/1');

        expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('does not send Content-Type on GET requests', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        const amapiFetch = createAmapiFetch({
            matrixOrigin: 'https://www.arts.qld.gov.au',
            token: 'test-token',
            fetchImpl,
        });

        await amapiFetch('/assets/1354');

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://www.arts.qld.gov.au/__management_api/v1/assets/1354',
            expect.objectContaining({
                method: 'GET',
                headers: expect.not.objectContaining({
                    'Content-Type': 'application/json',
                }),
            }),
        );
        expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });
});
