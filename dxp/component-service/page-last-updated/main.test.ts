import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import pageLastUpdated from './main.js';

const CURRENT_ASSET_ID = '472';

const matrixEnv = {
    API_IDENTIFIER: 'test-identifier',
    BASE_DOMAIN: 'https://example.test',
    BASE_PATH: '/matrix',
    MX_API: 'https://matrix.example.test/api',
    BEARER_AUTH: 'test-token',
};

/** Expected markup for a formatted date. */
function markup(date: string): string {
    return `<dl class="qld-content-dates my-0"><dt class="my-0">Last updated:</dt><dd class="my-0">${date}</dd></dl>`;
}

/** Component info for a page the component is placed on. */
function placed(editor = false): DxpComponentInfo {
    return {
        ctx: {assetId: CURRENT_ASSET_ID, ...(editor ? {editor: true} : {})},
        env: matrixEnv,
    } as DxpComponentInfo;
}

/** Content API asset payload for the placed page, with an `updated.date`. */
function assetWithUpdated(updatedDate: unknown) {
    return {
        id: CURRENT_ASSET_ID,
        type: 'page',
        name: 'Content page',
        updated: {date: updatedDate, user_id: 'user-1'},
    };
}

/** Stub the Matrix asset request with the given JSON payload. */
function stubAsset(payload: unknown) {
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

describe('pageLastUpdated main', () => {
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
        it('outputs the updated date in the qld-content-dates markup', async () => {
            stubAsset(assetWithUpdated('2026-03-05'));

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe(markup('05 March 2026'));
        });

        it('converts the sample updated timestamp to the Queensland date', async () => {
            // 14:15:22 UTC on 24 August is 00:15 on 25 August in Brisbane (UTC+10).
            stubAsset(assetWithUpdated('2019-08-24T14:15:22Z'));

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe(markup('25 August 2019'));
        });

        it('reads updated.date from the asset, not the last-updated metadata', async () => {
            stubAsset({
                ...assetWithUpdated('2026-03-05'),
                metadata: {'last-updated': '1900-01-31'},
            });

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe(markup('05 March 2026'));
        });

        it('renders nothing when only last-updated metadata is present', async () => {
            stubAsset({
                id: CURRENT_ASSET_ID,
                metadata: {'last-updated': '1900-01-31'},
            });

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe('');
        });

        it('renders nothing when the updated field is missing', async () => {
            stubAsset({id: CURRENT_ASSET_ID, name: 'Content page'});

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe('');
        });

        it('renders nothing when updated.date is not a date', async () => {
            stubAsset(assetWithUpdated('Recently'));

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe('');
        });

        it('renders nothing when the asset request fails', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => new Response('', {status: 500})),
            );

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe('');
        });

        it('renders nothing when the asset request throws', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => {
                    throw new Error('network down');
                }),
            );

            const html = await pageLastUpdated.main({}, placed());

            expect(html).toBe('');
        });

        it('requests the default asset response without a data parameter', async () => {
            const fetchMock = stubAsset(assetWithUpdated('2026-03-05'));

            await pageLastUpdated.main({}, placed());

            const endpoint = String(fetchMock.mock.calls[0][0]);
            expect(endpoint).toContain(`/assets/${CURRENT_ASSET_ID}`);
            expect(new URL(endpoint).searchParams.has('data')).toBe(false);
        });

        it('uses the live date in the editor when placed', async () => {
            stubAsset(assetWithUpdated('2026-07-04'));

            const html = await pageLastUpdated.main({}, placed(true));

            expect(html).toBe(markup('04 July 2026'));
        });

        it('is not editable: the markup has no data-sq-field attribute', async () => {
            stubAsset(assetWithUpdated('2026-03-05'));

            const html = await pageLastUpdated.main({}, placed(true));

            expect(html).not.toContain('data-sq-field');
        });
    });

    describe('no placement', () => {
        it('shows the mock date in the editor', async () => {
            const fetchMock = stubAsset(assetWithUpdated('2026-03-05'));

            const html = await pageLastUpdated.main({}, {
                ctx: {editor: true},
            } as DxpComponentInfo);

            expect(html).toBe(markup('31 January 1900'));
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('shows the mock date in local dev', async () => {
            const fetchMock = stubAsset(assetWithUpdated('2026-03-05'));

            const html = await pageLastUpdated.main({}, {
                ctx: {},
                env: {IS_LOCAL: 'true'},
            } as DxpComponentInfo);

            expect(html).toBe(markup('31 January 1900'));
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('shows the mock date without component info (Storybook)', async () => {
            const html = await pageLastUpdated.main({});

            expect(html).toBe(markup('31 January 1900'));
        });

        it('renders nothing on a live page', async () => {
            const fetchMock = stubAsset(assetWithUpdated('2026-03-05'));

            const html = await pageLastUpdated.main({}, {
                ctx: {},
            } as DxpComponentInfo);

            expect(html).toBe('');
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
