import {afterEach, describe, expect, it, vi} from 'vitest';
import {fetchSiteHeaderLineage} from './fetchSiteHeaderLineage.js';
import {SITE_ROOT_ASSET_ID} from './siteLineageToHeaderNav.js';
import {siteLineageToHeaderNav} from './siteLineageToHeaderNav.js';
import type {SiteLineagePayload} from './types.js';

const contentApiEnv = {
    MX_API: 'https://matrix.example/__api',
    BEARER_AUTH: 'test-token',
    BASE_DOMAIN: 'https://matrix.example/arts-rebuild-2026',
    BASE_PATH: '/services/mx',
};

const childrenWithoutSiteRoot: SiteLineagePayload = {
    links: [
        {
            parent_asset_id: SITE_ROOT_ASSET_ID,
            child_asset_id: '470',
            type: 1,
        },
    ],
    assets: [
        {
            id: '470',
            type: 'page_content',
            name: 'Alerts and Restrictions',
            short_name: 'alerts-and-restrictions',
            url: '',
        },
    ],
};

const siteRootAsset = {
    id: SITE_ROOT_ASSET_ID,
    type: 'site',
    name: 'NSW RFS Website',
    url: '/arts-rebuild-2026',
    status: {code: 'live'},
};

describe('fetchSiteHeaderLineage', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('fetches site root asset when children payload omits the parent', async () => {
        // Diagnostics are off by default; this test asserts them, so turn them on.
        vi.stubEnv('SITE_LINEAGE_DEBUG', 'true');
        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => childrenWithoutSiteRoot,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => siteRootAsset,
            });

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const lineage = await fetchSiteHeaderLineage({env: contentApiEnv}, {fetchImpl, maxDepth: 1});

        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(fetchImpl.mock.calls[1][0]).toContain(`/assets/${SITE_ROOT_ASSET_ID}`);
        expect(lineage.assets?.some((asset) => asset.id === SITE_ROOT_ASSET_ID)).toBe(true);
        expect(consoleError).toHaveBeenCalledWith(
            'Header Nav: fetchSiteHeaderLineage complete',
            expect.objectContaining({
                hasSiteRootAsset: true,
                siteRootFetched: true,
            }),
        );
        expect(consoleError).toHaveBeenCalledWith(
            'Header Nav: HTTP request',
            expect.objectContaining({
                endpoint: expect.stringContaining(`/assets/${SITE_ROOT_ASSET_ID}`),
            }),
        );

        const items = siteLineageToHeaderNav(lineage);
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Alerts and Restrictions');
        expect(items[0].url).toBe('/arts-rebuild-2026/alerts-and-restrictions');

        consoleError.mockRestore();
    });

    it('does not refetch site root when children payload already includes it', async () => {
        const childrenWithSiteRoot: SiteLineagePayload = {
            links: childrenWithoutSiteRoot.links,
            assets: [siteRootAsset, ...(childrenWithoutSiteRoot.assets ?? [])],
        };

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => childrenWithSiteRoot,
        });

        const lineage = await fetchSiteHeaderLineage({env: contentApiEnv}, {fetchImpl, maxDepth: 1});

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(lineage.assets?.some((asset) => asset.id === SITE_ROOT_ASSET_ID)).toBe(true);
    });

    it('does not expand children of Type 2, Type 3, notice or untyped links', async () => {
        const payloads: Record<string, SiteLineagePayload> = {
            [SITE_ROOT_ASSET_ID]: {
                links: [
                    {
                        parent_asset_id: SITE_ROOT_ASSET_ID,
                        child_asset_id: 'menu-hub',
                        type: 1,
                    },
                    {
                        parent_asset_id: SITE_ROOT_ASSET_ID,
                        child_asset_id: 'hidden-hub',
                        type: 2,
                    },
                    {
                        parent_asset_id: SITE_ROOT_ASSET_ID,
                        child_asset_id: 'type-three-hub',
                        type: 4,
                    },
                    {
                        parent_asset_id: SITE_ROOT_ASSET_ID,
                        child_asset_id: 'notice-hub',
                        type: 8,
                    },
                    {
                        parent_asset_id: SITE_ROOT_ASSET_ID,
                        child_asset_id: 'untyped-hub',
                    },
                ],
                assets: [
                    siteRootAsset,
                    ...['menu-hub', 'hidden-hub', 'type-three-hub', 'notice-hub', 'untyped-hub'].map((id) => ({
                        id,
                        type: 'page_content',
                        name: id,
                        url: `/${id}`,
                    })),
                ],
            },
        };

        const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
            const match = /\/assets\/([^/?]+)\/children/.exec(String(input));
            return {
                ok: true,
                json: async () => payloads[match?.[1] ?? ''] ?? {links: [], assets: []},
            };
        });

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        await fetchSiteHeaderLineage({env: contentApiEnv}, {fetchImpl: fetchImpl as unknown as typeof fetch, maxDepth: 2});

        const requestedUrls = fetchImpl.mock.calls.map(([input]) => String(input));
        expect(requestedUrls.some((url) => url.includes('/assets/menu-hub/children'))).toBe(true);
        for (const id of ['hidden-hub', 'type-three-hub', 'notice-hub', 'untyped-hub']) {
            expect(requestedUrls.some((url) => url.includes(`/assets/${id}/`))).toBe(false);
        }

        consoleError.mockRestore();
    });
});
