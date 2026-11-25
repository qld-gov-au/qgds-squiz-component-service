import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import previewHeaderNavigation from './fixtures/preview-header-navigation.json';
import {resolveSiteHeaderNavigation} from './resolveSiteHeaderNavigation.js';
import type {SiteLineagePayload} from './types.js';

const contentApiEnv = {
    MX_API: 'https://matrix.example/__api',
    BEARER_AUTH: 'test-token',
    BASE_DOMAIN: 'https://matrix.example/site-mount',
    BASE_PATH: '/services/mx',
};

describe('resolveSiteHeaderNavigation', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.stubEnv('IS_LOCAL', 'false');
        delete process.env.VITE_AMAPI_TOKEN;
        delete process.env.AMAPI_TOKEN;
        delete process.env.ASSET_MANAGEMENT_BEARER_TOKEN;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });
    it('returns preview fixture in editor mode when Matrix env is not configured', async () => {
        const items = await resolveSiteHeaderNavigation({
            ctx: {editor: true},
        });

        expect(items).toEqual(previewHeaderNavigation);
        expect(items).toHaveLength(4);
        expect(items[0].title).toBe('Section one');
    });

    it('fetches live navigation in editor mode when Matrix env is configured', async () => {
        const lineage: SiteLineagePayload = {
            links: [{parent_asset_id: '465', child_asset_id: '470', type: 1}],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    status: {code: 'live'},
                },
            ],
        };

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineage,
        });

        const items = await resolveSiteHeaderNavigation({ctx: {editor: true}, env: contentApiEnv}, {fetchImpl});

        expect(fetchImpl).toHaveBeenCalled();
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Alerts and Restrictions');
    });

    it('returns preview fixture when Matrix env is not configured', async () => {
        const items = await resolveSiteHeaderNavigation({});

        expect(items).toEqual(previewHeaderNavigation);
    });

    it('fetches lineage when AMAPI is on component env despite boilerplate MX_API (dev-ui)', async () => {
        const lineage: SiteLineagePayload = {
            links: [{parent_asset_id: '465', child_asset_id: '470', type: 1}],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'Arts Queensland',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: "What's on",
                    url: '/whats-on',
                    status: {code: 'live'},
                },
            ],
        };

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineage,
        });

        const items = await resolveSiteHeaderNavigation(
            {
                fns: {resolveUri: () => ''},
                env: {
                    AMAPI_TOKEN: 'dev-token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                    MX_API: 'http://localhost:4000/__api',
                    BEARER_AUTH: ' ',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalled();
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe("What's on");
        expect(items).not.toEqual(previewHeaderNavigation);
    });

    it('returns override navigation when provided', async () => {
        const override = [
            {
                id: 'override-hub',
                title: 'Override hub',
                url: '/override',
            },
        ];

        const items = await resolveSiteHeaderNavigation({env: contentApiEnv}, {overrideNavigation: override});

        expect(items).toEqual(override);
    });

    it('fetches lineage and transforms header navigation when env is configured', async () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: '470', type: 1},
                {parent_asset_id: '470', child_asset_id: '471', type: 1},
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    status: {code: 'live'},
                },
                {
                    id: '471',
                    type: 'page_content',
                    name: 'Fires Near Me',
                    url: '/alerts-and-restrictions/fires-near-me',
                    status: {code: 'live'},
                },
            ],
        };

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineage,
        });

        const items = await resolveSiteHeaderNavigation({env: contentApiEnv}, {fetchImpl});

        expect(fetchImpl).toHaveBeenCalled();
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            id: '470',
            title: 'Alerts and Restrictions',
            url: '/alerts-and-restrictions',
        });
        expect(items[0].children?.[0]).toMatchObject({
            title: 'Fires Near Me',
            url: '/alerts-and-restrictions/fires-near-me',
        });
    });

    it('omits Type 2, Type 3, notice and untyped pages from a real-shape /children tree', async () => {
        const page = (id: string, name: string, path: string) => ({
            id,
            type: 'page_content',
            name,
            url: path,
            status: {code: 'live'},
        });
        const payloads: Record<string, SiteLineagePayload> = {
            '465': {
                links: [
                    {parent_asset_id: '465', child_asset_id: 'about', type: 1},
                    {parent_asset_id: '465', child_asset_id: 'type-two-hub', type: 2},
                ],
                assets: [{id: '465', type: 'site', name: 'Site', url: '/'}, page('about', 'About us', '/about'), page('type-two-hub', 'Type two hub', '/type-two-hub')],
            },
            about: {
                links: [
                    {parent_asset_id: 'about', child_asset_id: 'team', type: 1},
                    {parent_asset_id: 'about', child_asset_id: 'test-page', type: 2},
                    {parent_asset_id: 'about', child_asset_id: 'type-three', type: 4},
                    {parent_asset_id: 'about', child_asset_id: 'notice', type: 8},
                    {parent_asset_id: 'about', child_asset_id: 'untyped'},
                ],
                assets: [
                    page('team', 'Team', '/about/team'),
                    page('test-page', 'Test Page', '/about/test-page'),
                    page('type-three', 'Type three', '/about/type-three'),
                    page('notice', 'Notice', '/about/notice'),
                    page('untyped', 'Untyped', '/about/untyped'),
                ],
            },
            team: {links: [], assets: []},
        };

        const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
            const match = /\/assets\/([^/?]+)\/children/.exec(String(input));
            return {
                ok: true,
                json: async () => payloads[match?.[1] ?? ''] ?? {links: [], assets: []},
            };
        });

        const items = await resolveSiteHeaderNavigation({env: contentApiEnv}, {fetchImpl: fetchImpl as unknown as typeof fetch});

        expect(items.map((item) => item.title)).toEqual(['About us']);
        expect(items[0].children?.map((child) => child.title)).toEqual(['Team']);

        const requestedUrls = fetchImpl.mock.calls.map(([input]) => String(input));
        expect(requestedUrls.some((url) => url.includes('/assets/type-two-hub/'))).toBe(false);
        expect(requestedUrls.some((url) => url.includes('/assets/test-page/'))).toBe(false);
    });

    it('returns preview fixture when fetch fails in local (non-edge) context', async () => {
        const fetchImpl = vi.fn().mockRejectedValue(new Error('network error'));

        const items = await resolveSiteHeaderNavigation({env: contentApiEnv}, {fetchImpl});

        expect(items).toEqual(previewHeaderNavigation);
    });

    it('returns an empty array when fetch fails on Edge runtime', async () => {
        const fetchImpl = vi.fn().mockRejectedValue(new Error('network error'));

        const items = await resolveSiteHeaderNavigation(
            {
                env: contentApiEnv,
                fns: {resolveUri: () => ''},
            },
            {fetchImpl},
        );

        expect(items).toEqual([]);
    });

    it('falls back to preview fixture when fetch fails on dev-ui with AMAPI env', async () => {
        const fetchImpl = vi.fn().mockRejectedValue(new Error('network error'));

        const items = await resolveSiteHeaderNavigation(
            {
                env: {
                    AMAPI_TOKEN: 'dev-token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                    MX_API: 'http://localhost:4000/__api',
                },
                fns: {resolveUri: () => ''},
            },
            {fetchImpl},
        );

        expect(items).toEqual(previewHeaderNavigation);
    });

    it('falls back to preview fixture when live nav is empty in local dev', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({links: [], assets: []}),
        });

        const items = await resolveSiteHeaderNavigation({env: contentApiEnv}, {fetchImpl});

        expect(items).toEqual(previewHeaderNavigation);
    });

    it('prefers explicit fetchImpl over local AMAPI proxy', async () => {
        vi.stubEnv('AMAPI_TOKEN', 'local-token');
        vi.stubEnv('BASE_URL', 'https://matrix.example');

        const lineage: SiteLineagePayload = {
            links: [{parent_asset_id: '465', child_asset_id: '470', type: 1}],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    status: {code: 'live'},
                },
            ],
        };

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineage,
        });

        const items = await resolveSiteHeaderNavigation({env: contentApiEnv}, {fetchImpl});

        expect(fetchImpl).toHaveBeenCalled();
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Alerts and Restrictions');
    });

    it('prepends rebuild mount path to header URLs on Matrix rebuild dev', async () => {
        const lineage: SiteLineagePayload = {
            links: [{parent_asset_id: '465', child_asset_id: '470', type: 1}],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/site-mount',
                    status: {code: 'live'},
                },
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    status: {code: 'live'},
                },
            ],
        };

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => lineage,
        });

        const items = await resolveSiteHeaderNavigation(
            {
                env: {
                    ...contentApiEnv,
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud',
                },
            },
            {fetchImpl},
        );

        expect(items[0].url).toBe('/site-mount/alerts-and-restrictions');
    });
});
