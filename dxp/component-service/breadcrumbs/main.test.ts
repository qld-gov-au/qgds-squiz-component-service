import {afterEach, describe, expect, it, vi} from 'vitest';
import pageContentFixture from '../../utils/matrix/siteLineage/fixtures/site-lineage-page-content.json';
import breadcrumbs from './main.js';
import previewTrail from './preview-trail.json';

const placedInfo = {
    ctx: {
        assetId: '472',
        url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/whats-on/content-page',
    },
    env: {
        MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
        BEARER_AUTH: 'token',
    },
};

/** Stub the global fetch used by fetchSiteLineage. No live Matrix calls. */
function stubLineage(payload: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

/** Assert the mock trail from preview-trail.json is rendered, with the last item as the current page. */
function expectPreviewTrail(html: string) {
    for (const item of previewTrail) {
        expect(html).toContain(item.title);
    }
    const current = previewTrail[previewTrail.length - 1];
    expect(html).toContain(`<li class="breadcrumb-item active" aria-current="page">${current.title}</li>`);
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('breadcrumbs main', () => {
    it('renders ancestors as links and the current page as text', async () => {
        stubLineage(pageContentFixture);

        const html = await breadcrumbs.main({}, placedInfo);

        expect(html).toContain('<nav aria-label="breadcrumb"><ol class="breadcrumb">');
        expect(html).toContain('<li class="breadcrumb-item"><a href="/">Home</a></li>');
        expect(html).toContain('<li class="breadcrumb-item"><a href="/whats-on">What&#39;s on</a></li>');
        expect(html).toContain('<li class="breadcrumb-item active" aria-current="page">Content page</li>');
        expect(html).not.toContain('href="/whats-on/content-page"');
    });

    it('returns an empty string when the lineage has no trail', async () => {
        stubLineage({links: [], assets: []});

        const html = await breadcrumbs.main({}, placedInfo);

        expect(html).toBe('');
    });

    it('escapes asset names and urls so they cannot break out of the markup', async () => {
        const lineage = structuredClone(pageContentFixture) as {
            assets: Array<{id: string; name: string; url?: string}>;
        };
        for (const asset of lineage.assets) {
            if (asset.id === '472') {
                asset.name = '<img src=x onerror="alert(1)">';
            }
            if (asset.id === '470') {
                asset.url = '/whats-on"onmouseover="alert(1)';
            }
        }
        stubLineage(lineage);

        const html = await breadcrumbs.main({}, placedInfo);

        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
        expect(html).not.toContain('onerror="');
        expect(html).not.toContain('onmouseover="');
    });

    it('applies escaped wrapper classes to the nav', async () => {
        stubLineage(pageContentFixture);

        const html = await breadcrumbs.main({wrapperClasses: 'dark "extra"'}, placedInfo);

        expect(html).toContain('<nav aria-label="breadcrumb" class="dark &quot;extra&quot;">');
    });

    it('renders the mock trail in editor mode without placement', async () => {
        vi.stubEnv('IS_LOCAL', '');
        const fetchMock = stubLineage(pageContentFixture);

        const html = await breadcrumbs.main({}, {ctx: {editor: true}});

        expectPreviewTrail(html);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('renders the mock trail in local dev (IS_LOCAL) without placement', async () => {
        vi.stubEnv('IS_LOCAL', 'true');
        const fetchMock = stubLineage(pageContentFixture);

        const html = await breadcrumbs.main({}, {ctx: {}});

        expectPreviewTrail(html);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('renders the mock trail when no utilities are passed (Storybook)', async () => {
        vi.stubEnv('IS_LOCAL', '');

        const html = await breadcrumbs.main({});

        expectPreviewTrail(html);
    });

    it('returns an empty string on a live page without placement', async () => {
        vi.stubEnv('IS_LOCAL', '');
        const fetchMock = stubLineage(pageContentFixture);

        const html = await breadcrumbs.main({}, {ctx: {}});

        expect(html).toBe('');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns an empty string when the lineage request fails', async () => {
        vi.stubEnv('IS_LOCAL', '');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 500}));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const html = await breadcrumbs.main({}, placedInfo);

        expect(html).toBe('');
        expect(consoleError).toHaveBeenCalled();
    });
});
