import {afterEach, describe, it, expect, vi} from 'vitest';
import {buildSiteLineageContentApiUrl, buildSiteLineageFetchHeaders, buildSiteLineageMatrixServiceUrl, fetchSectionChildrenTree, fetchSiteLineage} from './fetchSiteLineage.js';
import type {SiteLineagePayload} from './types.js';

afterEach(() => {
    vi.unstubAllEnvs();
});

const lineagePayload: SiteLineagePayload = {links: [], assets: []};
const contentApiEnv = {
    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
    BASE_PATH: '/services/mx',
    MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
    BEARER_AUTH: 'abcd1234',
};

describe('[fetchSiteLineage]', () => {
    it('requests lineage via Content API on Edge with Bearer auth', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {
                    assetId: '472',
                    url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/fire-information/content-page',
                },
                env: {
                    API_IDENTIFIER: 'RfsPublicWebsiteComponentServiceAPI',
                    ...contentApiEnv,
                },
                fns: {resolveUri: vi.fn()},
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://staging-web.matrix.squiz.cloud/__api/assets/472/lineage/site?include_dependents=true&base_url=https%3A%2F%2Fstaging-web.matrix.squiz.cloud%2Farts-rebuild-2026',
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer abcd1234',
                },
            },
        );
    });

    it('strips a Bearer prefix from BEARER_AUTH before sending', async () => {
        expect(buildSiteLineageFetchHeaders({env: {BEARER_AUTH: 'Bearer token-value'}}, {contentApi: true})).toEqual({
            Accept: 'application/json',
            Authorization: 'Bearer token-value',
        });
    });

    it('does not use resolveUri for site lineage on Edge', async () => {
        const resolveUri = vi.fn();
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {assetId: '472'},
                env: contentApiEnv,
                fns: {resolveUri},
            },
            {fetchImpl},
        );

        expect(resolveUri).not.toHaveBeenCalled();
        expect(fetchImpl).toHaveBeenCalledOnce();
    });

    it('expands section children via Content API after lineage on Edge', async () => {
        // Diagnostics are off by default; this test asserts them, so turn them on.
        vi.stubEnv('SITE_LINEAGE_DEBUG', 'true');
        const lineageWithPath: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: '470', type: 1},
                {parent_asset_id: '470', child_asset_id: '472', type: 1},
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/arts-rebuild-2026',
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Fire Information',
                    url: '/arts-rebuild-2026/fire-information',
                },
                {
                    id: '472',
                    type: 'page_content',
                    name: 'Content Page',
                    url: '/arts-rebuild-2026/fire-information/content-page',
                },
            ],
        };
        const sectionChildrenPayload: SiteLineagePayload = {
            links: [
                {parent_asset_id: '470', child_asset_id: '471', type: 1},
                {parent_asset_id: '470', child_asset_id: '472', type: 1},
            ],
            assets: [
                {
                    id: '471',
                    type: 'page_content',
                    name: 'Fires near me',
                    short_name: 'fires-near-me',
                    url: '',
                },
                {
                    id: '472',
                    type: 'page_content',
                    name: 'Content Page',
                    url: '/arts-rebuild-2026/fire-information/content-page',
                },
            ],
        };
        const emptyChildren: SiteLineagePayload = {links: [], assets: []};

        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => lineageWithPath,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => sectionChildrenPayload,
            })
            .mockResolvedValue({
                ok: true,
                json: async () => emptyChildren,
            });

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const lineage = await fetchSiteLineage(
            {
                ctx: {assetId: '472'},
                env: contentApiEnv,
                fns: {resolveUri: vi.fn()},
            },
            {fetchImpl},
        );

        expect(fetchImpl.mock.calls[0][0]).toContain('/lineage/site?');
        expect(fetchImpl.mock.calls[1][0]).toContain('/assets/470/children?depth=1');
        expect(lineage.assets?.map((asset) => asset.id).sort()).toEqual(['465', '470', '471', '472']);
        expect(consoleError).toHaveBeenCalledWith('Related content: expanded section children', expect.objectContaining({sectionRootId: '470', expandedAssets: 4}));
        consoleError.mockRestore();
    });

    it.each([
        ['Type 2 (hidden)', {type: 2}],
        ['Type 3', {type: 4}],
        ['notice', {type: 8}],
        ['undefined type', {}],
    ])('does not expand fetches through children with a %s link', async (_label, linkType) => {
        const sectionChildrenPayload: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: '470',
                    child_asset_id: 'hidden-hub',
                    ...linkType,
                },
            ],
            assets: [
                {
                    id: 'hidden-hub',
                    type: 'page_content',
                    name: 'Hidden hub',
                    url: '/fire-information/hidden-hub',
                },
            ],
        };
        const grandchildPayload: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: 'hidden-hub',
                    child_asset_id: 'visible-child',
                    type: 1,
                },
            ],
            assets: [
                {
                    id: 'visible-child',
                    type: 'page_content',
                    name: 'Visible child',
                    url: '/fire-information/visible-child',
                },
            ],
        };
        const emptyChildren: SiteLineagePayload = {links: [], assets: []};

        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => sectionChildrenPayload,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => grandchildPayload,
            })
            .mockResolvedValue({
                ok: true,
                json: async () => emptyChildren,
            });

        const merged = await fetchSectionChildrenTree({env: contentApiEnv}, '470', {fetchImpl, maxDepth: 3});

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(merged.assets?.map((asset) => asset.id).sort()).toEqual(['hidden-hub']);
    });

    it('skips a failed children fetch and keeps data from successful branches', async () => {
        const rootChildren: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: '465',
                    child_asset_id: '470',
                    link_type: 'menu',
                },
                {
                    parent_asset_id: '465',
                    child_asset_id: '1783',
                    link_type: 'menu',
                },
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'Site root',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Good hub',
                    url: '/good',
                    status: {code: 'live'},
                },
                {
                    id: '1783',
                    type: 'page_content',
                    name: 'Broken hub',
                    url: '/broken',
                    status: {code: 'live'},
                },
            ],
        };

        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => rootChildren,
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
            })
            .mockResolvedValue({
                ok: true,
                json: async () => ({links: [], assets: []}),
            });

        const merged = await fetchSectionChildrenTree({env: contentApiEnv}, '465', {fetchImpl, maxDepth: 2});

        expect(merged.assets?.some((asset) => asset.id === '470')).toBe(true);
        expect(merged.assets?.some((asset) => asset.id === '1783')).toBe(true);
    });

    it('throws on Edge when MX_API is available but BEARER_AUTH is missing', async () => {
        await expect(
            fetchSiteLineage(
                {
                    ctx: {assetId: '472'},
                    env: {
                        MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                        BASE_DOMAIN: contentApiEnv.BASE_DOMAIN,
                        BASE_PATH: contentApiEnv.BASE_PATH,
                    },
                    fns: {resolveUri: vi.fn()},
                },
                {fetchImpl: vi.fn()},
            ),
        ).rejects.toThrow('BEARER_AUTH is not configured on the component set');
    });

    it('falls back to Matrix service proxy on Edge when MX_API is missing', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {assetId: '472'},
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                    BASE_PATH: '/services/mx',
                },
                fns: {resolveUri: vi.fn()},
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/services/mx/site-lineage?include_dependents=true&base_url=https%3A%2F%2Fstaging-web.matrix.squiz.cloud%2Farts-rebuild-2026&assetId=472',
            {headers: {Accept: 'application/json'}},
        );
    });

    it('throws on Edge when neither MX_API nor proxy env is configured', async () => {
        await expect(
            fetchSiteLineage(
                {
                    ctx: {assetId: '472'},
                    env: {API_IDENTIFIER: 'RfsPublicWebsiteComponentServiceAPI'},
                    fns: {resolveUri: vi.fn()},
                },
                {fetchImpl: vi.fn()},
            ),
        ).rejects.toThrow('Content API base URL is not configured (use AMAPI for local Matrix access — see docs/ARCHITECTURE.md)');
    });

    it('requests lineage via Matrix service proxy when BASE_DOMAIN and BASE_PATH are set without MX_API', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {
                    assetId: '472',
                },
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                    BASE_PATH: '/services/mx',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/services/mx/site-lineage?include_dependents=true&base_url=https%3A%2F%2Fstaging-web.matrix.squiz.cloud%2Farts-rebuild-2026&assetId=472',
            {headers: {Accept: 'application/json'}},
        );
    });

    it('requests lineage by asset ID when ctx.assetId is available (MX_API fallback)', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {
                    assetId: '1234',
                    url: 'https://www.rfs.nsw.gov.au/fire-information/fires-near-me',
                },
                env: {
                    MX_API: 'https://matrix.example/__api',
                    BEARER_AUTH: 'test-token',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith('https://matrix.example/__api/assets/1234/lineage/site?include_dependents=true&base_url=https%3A%2F%2Fwww.rfs.nsw.gov.au', {
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer test-token',
            },
        });
    });

    it('requests lineage by URL when asset ID is unavailable (MX_API fallback)', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {
                    url: 'https://www.rfs.nsw.gov.au/fire-information/fires-near-me',
                },
                env: {
                    MX_API: 'https://matrix.example/__api/',
                    BEARER_AUTH: 'test-token',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://matrix.example/__api/assets/by_url/lineage/site?include_dependents=true&base_url=https%3A%2F%2Fwww.rfs.nsw.gov.au&url=https%3A%2F%2Fwww.rfs.nsw.gov.au%2Ffire-information%2Ffires-near-me',
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer test-token',
                },
            },
        );
    });

    it('throws when Content API base URL is not configured (non-edge)', async () => {
        await expect(
            fetchSiteLineage({
                ctx: {assetId: '1234'},
                env: {},
            }),
        ).rejects.toThrow('Content API base URL is not configured (use AMAPI for local Matrix access');
    });

    it('requests lineage by numeric placement asset ID (MX_API fallback)', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {
                    assetId: 1234,
                    url: 'https://www.rfs.nsw.gov.au/fire-information/fires-near-me',
                },
                env: {
                    MX_API: 'https://matrix.example/__api',
                    BEARER_AUTH: 'test-token',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith('https://matrix.example/__api/assets/1234/lineage/site?include_dependents=true&base_url=https%3A%2F%2Fwww.rfs.nsw.gov.au', {
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer test-token',
            },
        });
    });

    it('derives Content API base URL from page origin when MX_API is unset (non-edge)', async () => {
        const originalEnv = {...process.env};
        delete process.env.MX_API;
        delete process.env.BASE_DOMAIN;
        delete process.env.BASE_PATH;
        delete process.env.BEARER_AUTH;

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        try {
            await expect(
                fetchSiteLineage(
                    {
                        ctx: {
                            assetId: '1234',
                            url: 'https://www.rfs.nsw.gov.au/fire-information/fires-near-me',
                        },
                        env: {},
                    },
                    {fetchImpl},
                ),
            ).rejects.toThrow('BEARER_AUTH is not configured for Content API');
        } finally {
            process.env = originalEnv;
        }
    });

    it('uses BASE_DOMAIN for base_url when configured with derived Content API', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineagePayload,
        });

        await fetchSiteLineage(
            {
                ctx: {
                    assetId: '472',
                    url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/fire-information/content-page',
                },
                env: {
                    ...contentApiEnv,
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                    BASE_PATH: '/services/mx',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://staging-web.matrix.squiz.cloud/__api/assets/472/lineage/site?include_dependents=true&base_url=https%3A%2F%2Fstaging-web.matrix.squiz.cloud%2Farts-rebuild-2026',
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer abcd1234',
                },
            },
        );
    });

    it('throws when the Content API response is not ok', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ok: false, status: 403});

        await expect(
            fetchSiteLineage(
                {
                    ctx: {assetId: '1234'},
                    env: {
                        MX_API: 'https://matrix.example/__api',
                        BEARER_AUTH: 'test-token',
                    },
                },
                {fetchImpl},
            ),
        ).rejects.toThrow('Site lineage request failed with status 403');
    });
});

describe('[buildSiteLineageContentApiUrl]', () => {
    it('builds a Content API lineage URL', () => {
        expect(
            buildSiteLineageContentApiUrl(
                {env: {MX_API: 'https://matrix.example/__api'}},
                {
                    assetId: '472',
                    urlResolutionBase: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                },
            ),
        ).toBe('https://matrix.example/__api/assets/472/lineage/site?include_dependents=true&base_url=https%3A%2F%2Fstaging-web.matrix.squiz.cloud%2Farts-rebuild-2026');
    });
});

describe('[buildSiteLineageMatrixServiceUrl]', () => {
    it('builds a Matrix service proxy URL', () => {
        expect(
            buildSiteLineageMatrixServiceUrl(
                {
                    env: {
                        BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                        BASE_PATH: '/services/mx',
                    },
                },
                {
                    assetId: '472',
                    urlResolutionBase: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                },
            ),
        ).toBe(
            'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/services/mx/site-lineage?include_dependents=true&base_url=https%3A%2F%2Fstaging-web.matrix.squiz.cloud%2Farts-rebuild-2026&assetId=472',
        );
    });
});
