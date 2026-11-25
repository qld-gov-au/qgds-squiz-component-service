import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import lineageFixture from '../../utils/matrix/siteLineage/fixtures/site-lineage-page-content.json';
import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import pageTitle from './main.js';
import previewTitle from './preview-title.json';

const CURRENT_ASSET_ID = '472';
const CURRENT_NAME = 'Content page';

const matrixEnv = {
    API_IDENTIFIER: 'test-identifier',
    BASE_DOMAIN: 'https://example.test',
    BASE_PATH: '/matrix',
    MX_API: 'https://matrix.example.test/api',
    BEARER_AUTH: 'test-token',
};

/** Component info for a page the component is placed on. */
function placed(): DxpComponentInfo {
    return {
        ctx: {assetId: CURRENT_ASSET_ID},
        env: matrixEnv,
    } as DxpComponentInfo;
}

/** Lineage payload where the current asset has the given name. */
function lineageWithName(name: string) {
    return {
        ...lineageFixture,
        assets: lineageFixture.assets.map((asset) => (asset.id === CURRENT_ASSET_ID ? {...asset, name} : asset)),
    };
}

/** Stub the Matrix lineage request with the given JSON payload. */
function stubLineage(payload: unknown) {
    const fetchMock = vi.fn(
        async () =>
            new Response(JSON.stringify(payload), {
                status: 200,
                headers: {'Content-Type': 'application/json'},
            }),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

describe('pageTitle main', () => {
    beforeEach(() => {
        // Keep local .env values out of these tests.
        vi.stubEnv('IS_LOCAL', '');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe('placed on a page', () => {
        it('outputs the current page name in an h1', async () => {
            stubLineage(lineageFixture);

            const html = await pageTitle.main({}, placed());

            expect(html).toBe(`<h1>${CURRENT_NAME}</h1>`);
        });

        it('uses the asset whose id matches the placed page', async () => {
            stubLineage(lineageWithName('Renamed page'));

            const html = await pageTitle.main({}, placed());

            expect(html).toBe('<h1>Renamed page</h1>');
        });

        it('escapes markup and quotes in the page name', async () => {
            stubLineage(lineageWithName('<img src=x onerror="alert(1)"> Fire & rescue'));

            const html = await pageTitle.main({}, placed());

            expect(html).not.toContain('<img');
            expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
            expect(html).toContain('Fire &amp; rescue');
        });

        it('trims whitespace around the name', async () => {
            stubLineage(lineageWithName('  Content page  '));

            const html = await pageTitle.main({}, placed());

            expect(html).toBe(`<h1>${CURRENT_NAME}</h1>`);
        });

        it('renders nothing when the placed asset is not in the lineage', async () => {
            stubLineage({
                ...lineageFixture,
                assets: lineageFixture.assets.filter((asset) => asset.id !== CURRENT_ASSET_ID),
            });

            const html = await pageTitle.main({}, placed());

            expect(html).toBe('');
        });

        it('renders nothing when the asset has no name', async () => {
            stubLineage(lineageWithName('   '));

            const html = await pageTitle.main({}, placed());

            expect(html).toBe('');
        });

        it('renders nothing when the lineage request fails', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => new Response('', {status: 500})),
            );

            const html = await pageTitle.main({}, placed());

            expect(html).toBe('');
        });

        it('uses the live name in the editor when placed', async () => {
            stubLineage(lineageWithName('Editor page'));

            const html = await pageTitle.main({}, {ctx: {assetId: CURRENT_ASSET_ID, editor: true}, env: matrixEnv});

            expect(html).toBe('<h1>Editor page</h1>');
        });
    });

    describe('no placement', () => {
        it('shows the mock name in the editor', async () => {
            const fetchMock = stubLineage(lineageFixture);

            const html = await pageTitle.main({}, {ctx: {editor: true}});

            expect(html).toBe(`<h1>${previewTitle.name}</h1>`);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('shows the mock name in local dev', async () => {
            const fetchMock = stubLineage(lineageFixture);

            const html = await pageTitle.main({}, {ctx: {}, env: {IS_LOCAL: 'true'}});

            expect(html).toBe(`<h1>${previewTitle.name}</h1>`);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('shows the mock name without component info (Storybook)', async () => {
            const html = await pageTitle.main({});

            expect(html).toBe(`<h1>${previewTitle.name}</h1>`);
        });

        it('renders nothing on a live page', async () => {
            const fetchMock = stubLineage(lineageFixture);

            const html = await pageTitle.main({}, {ctx: {}});

            expect(html).toBe('');
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
