import {afterEach, describe, it, expect, vi} from 'vitest';
import previewBreadcrumbs from './fixtures/preview-breadcrumbs.json';
import pageContentFixture from './fixtures/site-lineage-page-content.json';
import {resolveBreadcrumbs} from './resolveBreadcrumbs.js';
import type {BreadcrumbItem, SiteLineagePayload} from './types.js';

const previewItems = previewBreadcrumbs as BreadcrumbItem[];
const pageContentLineage = pageContentFixture as SiteLineagePayload;

/** Calls whose first argument is a resolver log line (not shared siteLineage diagnostics). */
function breadcrumbLogCalls(spy: {mock: {calls: unknown[][]}}) {
    return spy.mock.calls.filter(([message]) => String(message).startsWith('Breadcrumbs:'));
}

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('[resolveBreadcrumbs]', () => {
    it('returns preview items in editor mode without placement context', async () => {
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const breadcrumbs = await resolveBreadcrumbs({
            ctx: {editor: true},
        });

        expect(breadcrumbs).toEqual(previewItems);
        expect(consoleWarn).toHaveBeenCalledWith('Breadcrumbs: using preview breadcrumbs fixture', 'no-placement');
        consoleWarn.mockRestore();
    });

    it('fetches site lineage in editor mode when assetId is available', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => pageContentLineage,
        });

        const breadcrumbs = await resolveBreadcrumbs(
            {
                ctx: {
                    editor: true,
                    assetId: '472',
                    url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/whats-on/content-page',
                },
                env: {
                    MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                    BEARER_AUTH: 'token',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalled();
        expect(breadcrumbs).toEqual([
            {title: 'Home', url: '/'},
            {title: "What's on", url: '/whats-on'},
            {title: 'Content page', url: '/whats-on/content-page'},
        ]);
    });

    it('fetches and transforms site lineage when API is available', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => pageContentLineage,
        });

        const breadcrumbs = await resolveBreadcrumbs(
            {
                ctx: {
                    assetId: '472',
                    url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/whats-on/content-page',
                },
                env: {
                    MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                    BEARER_AUTH: 'token',
                },
            },
            {fetchImpl},
        );

        expect(fetchImpl).toHaveBeenCalled();
        expect(breadcrumbs).toEqual([
            {title: 'Home', url: '/'},
            {title: "What's on", url: '/whats-on'},
            {title: 'Content page', url: '/whats-on/content-page'},
        ]);
    });

    it('returns empty trail when fetch fails for a placed page', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ok: false, status: 500});
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const breadcrumbs = await resolveBreadcrumbs(
            {
                ctx: {
                    assetId: '472',
                    url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/whats-on/content-page',
                },
                env: {
                    MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                    BEARER_AUTH: 'token',
                },
            },
            {fetchImpl},
        );

        expect(breadcrumbs).toEqual([]);
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('returns an empty trail for an empty lineage without resolver logs', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({links: [], assets: []}),
        });
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const breadcrumbs = await resolveBreadcrumbs(
            {
                ctx: {
                    assetId: '472',
                    url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/whats-on/content-page',
                },
                env: {
                    MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                    BEARER_AUTH: 'token',
                },
            },
            {fetchImpl},
        );

        expect(breadcrumbs).toEqual([]);
        expect(breadcrumbLogCalls(consoleWarn)).toEqual([]);
        expect(breadcrumbLogCalls(consoleError)).toEqual([]);
        consoleWarn.mockRestore();
        consoleError.mockRestore();
    });

    it('warns and returns an empty trail when Matrix env is missing for a placed page', async () => {
        // Blank the env keys that resolveComponentEnv falls back to from process.env.
        vi.stubEnv('API_IDENTIFIER', '');
        vi.stubEnv('BASE_DOMAIN', '');
        vi.stubEnv('BASE_PATH', '');
        vi.stubEnv('MX_API', '');
        vi.stubEnv('BASE_URL', '');
        const fetchImpl = vi.fn();
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // No page url, so the Content API base cannot be derived from it.
        const breadcrumbs = await resolveBreadcrumbs({ctx: {assetId: '472'}, env: {}}, {fetchImpl});

        expect(breadcrumbs).toEqual([]);
        expect(fetchImpl).not.toHaveBeenCalled();
        expect(consoleWarn).toHaveBeenCalledWith('Breadcrumbs: Matrix env is not configured for placement asset', '472');
        consoleWarn.mockRestore();
    });

    it('returns preview items only when there is no placement context and warns', async () => {
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const breadcrumbs = await resolveBreadcrumbs({ctx: {}});

        expect(breadcrumbs).toEqual(previewItems);
        expect(consoleWarn).toHaveBeenCalledWith('Breadcrumbs: using preview breadcrumbs fixture', 'no-placement');
        consoleWarn.mockRestore();
    });
});
