import {afterEach, describe, expect, it, vi} from 'vitest';
import {clearAmapiInMemoryCachesForTests} from './amapiResponseCache.js';
import {createContentApiAmapiFetch} from './createContentApiAmapiFetch.js';

const SITE_ROOT_ID = '465';
const HUB_ID = '470';
const CHILD_ID = '471';

function createAmapiFetchMock(handlers: Record<string, () => unknown>): typeof fetch {
    return vi.fn(async (input: RequestInfo | URL) => {
        const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const pathname = new URL(requestUrl).pathname.replace('/__management_api/v1', '');
        const key = pathname.split('?')[0];
        if (handlers[key]) {
            return new Response(JSON.stringify(handlers[key]()), {
                status: 200,
                headers: {'Content-Type': 'application/json'},
            });
        }
        return new Response(JSON.stringify({message: 'not found'}), {
            status: 404,
            headers: {'Content-Type': 'application/json'},
        });
    }) as typeof fetch;
}

describe('[createContentApiAmapiFetch]', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        clearAmapiInMemoryCachesForTests();
    });

    it('caches synthesized Content API GET responses when cacheTtlMs is set', async () => {
        const amapiUnderlying = vi.fn(
            createAmapiFetchMock({
                [`/assets/${SITE_ROOT_ID}`]: () => ({
                    id: SITE_ROOT_ID,
                    type: 'site',
                    attributes: {name: 'Site'},
                }),
            }),
        );

        const fetchImpl = createContentApiAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 'test-token',
            fetchImpl: amapiUnderlying,
            cacheTtlMs: 60_000,
        });

        const url = `http://localhost:4000/__api/assets/${SITE_ROOT_ID}?data=metadata`;
        await fetchImpl(url);
        await fetchImpl(url);

        expect(amapiUnderlying).toHaveBeenCalledTimes(1);
    });

    it('passes AMAPI metadata_values through a single-asset Content API response', async () => {
        const fetchImpl = createContentApiAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 'test-token',
            fetchImpl: createAmapiFetchMock({
                [`/assets/${SITE_ROOT_ID}`]: () => ({
                    id: SITE_ROOT_ID,
                    type: 'site',
                    attributes: {name: 'NSW RFS Website'},
                    metadata_values: {
                        socialFacebookUrl: {value: 'https://www.facebook.com/nswrfs'},
                        footerLinks: {value: ['295423']},
                    },
                }),
            }),
        });

        const response = await fetchImpl(`http://localhost:4000/__api/assets/${SITE_ROOT_ID}?data=metadata`);
        expect(response.ok).toBe(true);
        const asset = (await response.json()) as {
            metadata?: Record<string, unknown>;
        };
        expect(asset.metadata).toEqual({
            socialFacebookUrl: {value: 'https://www.facebook.com/nswrfs'},
            footerLinks: {value: ['295423']},
        });
    });

    it('synthesizes /children from AMAPI links and child assets', async () => {
        const amapiHandlers: Record<string, () => unknown> = {
            [`/assets/${SITE_ROOT_ID}`]: () => ({
                id: SITE_ROOT_ID,
                type: 'site',
                attributes: {name: 'NSW RFS Website'},
                web_paths: ['/arts-rebuild-2026'],
                status: {code: 'live'},
            }),
            [`/assets/${SITE_ROOT_ID}/links`]: () => [
                {
                    major_id: SITE_ROOT_ID,
                    minor_id: HUB_ID,
                    link_type: 'menu',
                    sort_order: 1,
                },
            ],
            [`/assets/${HUB_ID}`]: () => ({
                id: HUB_ID,
                type: 'page_content',
                attributes: {
                    name: 'Fire Information',
                    short_name: 'fire-information',
                },
                web_paths: ['/arts-rebuild-2026/fire-information'],
                status: {code: 'live'},
            }),
        };

        const fetchImpl = createContentApiAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 'test-token',
            fetchImpl: createAmapiFetchMock(amapiHandlers),
        });

        const response = await fetchImpl(`http://localhost:4000/__api/assets/${SITE_ROOT_ID}/children?depth=1&limit=100`);

        expect(response.ok).toBe(true);
        const payload = (await response.json()) as {
            links: Array<{parent_asset_id?: string; child_asset_id?: string}>;
            assets: Array<{id?: string; name?: string; url?: string}>;
        };

        expect(payload.links).toHaveLength(1);
        expect(payload.links[0]).toMatchObject({
            parent_asset_id: SITE_ROOT_ID,
            child_asset_id: HUB_ID,
            link_type: 'menu',
        });
        expect(payload.assets.some((asset) => asset.id === HUB_ID)).toBe(true);
        expect(payload.assets.find((asset) => asset.id === HUB_ID)?.url).toBe('/arts-rebuild-2026/fire-information');
    });

    it('still returns children when a menu-linked child asset GET fails (e.g. image)', async () => {
        const imageId = '1122';
        const amapiHandlers: Record<string, () => unknown> = {
            [`/assets/${HUB_ID}`]: () => ({
                id: HUB_ID,
                type: 'page_content',
                attributes: {name: 'Funding opportunities'},
                status: {code: 'live'},
            }),
            [`/assets/${HUB_ID}/links`]: () => [
                {
                    major_id: HUB_ID,
                    minor_id: CHILD_ID,
                    link_type: 'menu',
                    sort_order: 1,
                },
                {
                    major_id: HUB_ID,
                    minor_id: imageId,
                    link_type: 'menu',
                    sort_order: 2,
                },
            ],
            [`/assets/${CHILD_ID}`]: () => ({
                id: CHILD_ID,
                type: 'page_content',
                attributes: {name: 'Previous funding'},
                url: '/previous-funding',
                status: {code: 'live'},
            }),
        };

        const fetchImpl = createContentApiAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 'test-token',
            fetchImpl: vi.fn(async (input: RequestInfo | URL) => {
                const pathname = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url).pathname.replace('/__management_api/v1', '');
                const key = pathname.split('?')[0];
                if (key === `/assets/${imageId}`) {
                    return new Response(JSON.stringify({message: 'Unprocessable'}), {
                        status: 422,
                    });
                }
                if (amapiHandlers[key]) {
                    return new Response(JSON.stringify(amapiHandlers[key]()), {
                        status: 200,
                        headers: {'Content-Type': 'application/json'},
                    });
                }
                return new Response(JSON.stringify({message: 'not found'}), {
                    status: 404,
                });
            }) as typeof fetch,
        });

        const response = await fetchImpl(`http://localhost:4000/__api/assets/${HUB_ID}/children?depth=1`);

        expect(response.ok).toBe(true);
        const payload = (await response.json()) as {
            assets: Array<{id?: string}>;
        };
        expect(payload.assets.some((asset) => asset.id === CHILD_ID)).toBe(true);
        expect(payload.assets.some((asset) => asset.id === imageId)).toBe(false);
    });

    it('preserves sort_order from AMAPI child links', async () => {
        const amapiHandlers: Record<string, () => unknown> = {
            [`/assets/${HUB_ID}`]: () => ({
                id: HUB_ID,
                type: 'page_content',
                attributes: {name: 'Fire Information'},
                status: {code: 'live'},
            }),
            [`/assets/${HUB_ID}/links`]: () => [
                {
                    major_id: HUB_ID,
                    minor_id: CHILD_ID,
                    link_type: 'menu',
                    sort_order: 2,
                },
                {
                    major_id: HUB_ID,
                    minor_id: '999999',
                    link_type: 'menu',
                    sort_order: 1,
                },
            ],
            [`/assets/${CHILD_ID}`]: () => ({
                id: CHILD_ID,
                type: 'page_content',
                attributes: {name: 'Fires near me'},
                url: '/fire-information/fires-near-me',
                status: {code: 'live'},
            }),
            [`/assets/999999`]: () => ({
                id: '999999',
                type: 'page_content',
                attributes: {name: 'First child'},
                url: '/fire-information/first',
                status: {code: 'live'},
            }),
        };

        const fetchImpl = createContentApiAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 'test-token',
            fetchImpl: createAmapiFetchMock(amapiHandlers),
        });

        const response = await fetchImpl(`http://localhost:4000/__api/assets/${HUB_ID}/children?depth=1`);
        const payload = (await response.json()) as {
            links: Array<{child_asset_id?: string}>;
        };

        expect(payload.links.map((link) => link.child_asset_id)).toEqual(['999999', CHILD_ID]);
    });

    it('falls through to the underlying fetch for unsupported routes', async () => {
        const fallbackFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ok: true}), {status: 200}));

        const fetchImpl = createContentApiAmapiFetch({
            matrixOrigin: 'https://matrix.example',
            token: 'test-token',
            fetchImpl: fallbackFetch,
        });

        await fetchImpl('https://example.com/other');

        expect(fallbackFetch).toHaveBeenCalledOnce();
    });
});
