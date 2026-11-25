import {describe, expect, it, vi} from 'vitest';
import {resolveChildCards} from './resolveChildCards';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types';

/**
 * Child lookup tests. Every request is answered by a stubbed fetch with
 * inline fixtures. Nothing reaches a real Matrix origin.
 */

const info: DxpComponentInfo = {
    env: {
        MX_API: 'https://fixture.test/__api',
        BEARER_AUTH: 'token',
    },
};

const ROOT = '100';

interface Route {
    status?: number;
    body: unknown;
}

/** Route stubbed responses by a substring of the request URL. */
function stubFetch(routes: Record<string, Route>) {
    return vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const key = Object.keys(routes).find((path) => url.includes(path));
        if (!key) {
            return {ok: false, status: 404, json: async () => ({})} as Response;
        }
        const route = routes[key];
        const status = route.status ?? 200;
        return {
            ok: status >= 200 && status < 300,
            status,
            json: async () => route.body,
        } as Response;
    }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

const childrenPayload = {
    links: [
        {parent_asset_id: ROOT, child_asset_id: '201', link_type: 1},
        {parent_asset_id: ROOT, child_asset_id: '202', link_type: 1},
        {parent_asset_id: ROOT, child_asset_id: '203', link_type: 2},
        {parent_asset_id: ROOT, child_asset_id: '204', link_type: 1},
        {parent_asset_id: ROOT, child_asset_id: '205', link_type: 1},
    ],
    assets: [
        {
            id: '201',
            type: 'page_content',
            name: 'First page',
            url: '/first',
            status: {code: 'live'},
        },
        {
            id: '202',
            type: 'page_content',
            name: 'Second page',
            url: '/second',
            status: {code: 'live'},
        },
        {
            id: '203',
            type: 'page_content',
            name: 'Hidden page',
            url: '/hidden',
            status: {code: 'live'},
        },
        {
            id: '204',
            type: 'image',
            name: 'A picture',
            url: '/picture.png',
            status: {code: 'live'},
        },
        {
            id: '205',
            type: 'page_content',
            name: 'Archived page',
            url: '/archived',
            status: {code: 'archived'},
        },
    ],
};

const rootPayload = {
    id: ROOT,
    type: 'page_content',
    name: 'Root',
    url: '/root',
    status: {code: 'live'},
};

const routesFor = (extra: Record<string, Route> = {}) => ({
    [`/assets/${ROOT}/children`]: {body: childrenPayload},
    [`/assets/${ROOT}?`]: {body: rootPayload},
    ...extra,
});

describe('resolveChildCards', () => {
    it('includes page_redirect children with a menu link, name and url', async () => {
        const fetchImpl = stubFetch({
            [`/assets/${ROOT}/children`]: {
                body: {
                    links: [
                        {parent_asset_id: ROOT, child_asset_id: '301', type: 1},
                        {parent_asset_id: ROOT, child_asset_id: '201', link_type: 1},
                    ],
                    assets: [
                        {
                            id: '301',
                            type: 'page_redirect',
                            name: 'Moved page',
                            url: '/moved',
                            status: {code: 'live'},
                        },
                        {
                            id: '201',
                            type: 'page_content',
                            name: 'First page',
                            url: '/first',
                            status: {code: 'live'},
                        },
                    ],
                },
            },
            [`/assets/${ROOT}?`]: {body: rootPayload},
        });

        const items = await resolveChildCards(ROOT, info, {fetchImpl});

        expect(items.map((item) => item.id)).toEqual(['301', '201']);
        expect(items[0]).toEqual({
            id: '301',
            title: 'Moved page',
            url: '/moved',
        });
    });

    it('returns direct menu-visible navigable children in API order', async () => {
        const fetchImpl = stubFetch(routesFor());

        const items = await resolveChildCards(ROOT, info, {fetchImpl});

        expect(items.map((item) => item.id)).toEqual(['201', '202']);
        expect(items[0]).toEqual({
            id: '201',
            title: 'First page',
            url: '/first',
        });
    });

    it('excludes hidden links, non-navigable types and archived pages', async () => {
        const fetchImpl = stubFetch(routesFor());

        const items = await resolveChildCards(ROOT, info, {fetchImpl});
        const ids = items.map((item) => item.id);

        expect(ids).not.toContain('203'); // hidden link
        expect(ids).not.toContain('204'); // image, not a navigable type
        expect(ids).not.toContain('205'); // archived
    });

    it('requests only the direct children of the root', async () => {
        const fetchImpl = stubFetch(routesFor());

        await resolveChildCards(ROOT, info, {fetchImpl});

        const urls = fetchImpl.mock.calls.map(([input]) => String(input));
        const childUrl = urls.find((url) => url.includes('/children'));
        expect(childUrl).toContain('depth=1');
        expect(childUrl).toContain(`/assets/${ROOT}/children`);
        expect(urls.every((url) => url.startsWith('https://fixture.test/'))).toBe(true);
    });

    it('fetches the root asset when the children payload does not include it', async () => {
        const fetchImpl = stubFetch(routesFor());

        await resolveChildCards(ROOT, info, {fetchImpl});

        const urls = fetchImpl.mock.calls.map(([input]) => String(input));
        expect(urls.some((url) => url.includes(`/assets/${ROOT}?`))).toBe(true);
    });

    it('returns empty when the root has no child pages', async () => {
        const fetchImpl = stubFetch({
            [`/assets/${ROOT}/children`]: {
                body: {links: [], assets: []},
            },
            [`/assets/${ROOT}?`]: {body: rootPayload},
        });

        const items = await resolveChildCards(ROOT, info, {fetchImpl});

        expect(items).toEqual([]);
    });

    it('returns empty when the children request fails', async () => {
        const fetchImpl = stubFetch({
            [`/assets/${ROOT}/children`]: {status: 500, body: {}},
            [`/assets/${ROOT}?`]: {body: rootPayload},
        });

        const items = await resolveChildCards(ROOT, info, {fetchImpl});

        expect(items).toEqual([]);
    });

    it('returns empty without a root id and makes no request', async () => {
        const fetchImpl = stubFetch(routesFor());

        const items = await resolveChildCards('', info, {fetchImpl});

        expect(items).toEqual([]);
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('does not fetch metadata in name mode', async () => {
        const fetchImpl = stubFetch(routesFor());

        const items = await resolveChildCards(ROOT, info, {
            fetchImpl,
            display: 'name',
            descriptionMetadataFieldKey: 'page-lead',
        });

        const urls = fetchImpl.mock.calls.map(([input]) => String(input));
        expect(urls.some((url) => url.includes('data=metadata'))).toBe(false);
        expect(items.every((item) => item.description === undefined)).toBe(true);
    });

    it('reads the description from the configured metadata key', async () => {
        // The metadata request is `/assets/<id>?base_url=...&data=metadata`, so
        // the route keys match on the id and the `data=metadata` query.
        const fetchImpl = stubFetch({
            ...routesFor(),
            '/assets/201?base_url=https%3A%2F%2Ffixture.test&data=metadata': {
                body: {
                    id: '201',
                    type: 'page_content',
                    name: 'First page',
                    url: '/first',
                    metadata: {
                        'page-lead': {value: 'Lead text for first'},
                    },
                },
            },
            '/assets/202?base_url=https%3A%2F%2Ffixture.test&data=metadata': {
                body: {
                    id: '202',
                    type: 'page_content',
                    name: 'Second page',
                    url: '/second',
                    metadata: {
                        other: 'not the lead',
                    },
                },
            },
        });

        const items = await resolveChildCards(ROOT, info, {
            fetchImpl,
            display: 'name-and-description',
            descriptionMetadataFieldKey: 'page-lead',
        });

        expect(items.find((item) => item.id === '201')?.description).toBe('Lead text for first');
        expect(items.find((item) => item.id === '202')?.description).toBeUndefined();
    });

    it('keeps the card without a description when the metadata request fails', async () => {
        const fetchImpl = stubFetch({
            ...routesFor(),
            '/assets/201?base_url=https%3A%2F%2Ffixture.test&data=metadata': {
                status: 500,
                body: {},
            },
            '/assets/202?base_url=https%3A%2F%2Ffixture.test&data=metadata': {
                body: {id: '202', metadata: {'page-lead': 'Second lead'}},
            },
        });

        const items = await resolveChildCards(ROOT, info, {
            fetchImpl,
            display: 'name-and-description',
            descriptionMetadataFieldKey: 'page-lead',
        });

        expect(items.map((item) => item.id)).toEqual(['201', '202']);
        expect(items[0].description).toBeUndefined();
        expect(items[1].description).toBe('Second lead');
    });

    it('does not fetch metadata when no key is set', async () => {
        const fetchImpl = stubFetch(routesFor());

        await resolveChildCards(ROOT, info, {
            fetchImpl,
            display: 'name-and-description',
            descriptionMetadataFieldKey: '  ',
        });

        const urls = fetchImpl.mock.calls.map(([input]) => String(input));
        expect(urls.some((url) => url.includes('data=metadata'))).toBe(false);
    });
});
