import {describe, expect, it} from 'vitest';
import siteLineageFixture from './fixtures/site-lineage-page-content.json';
import {siteLineageToHeaderNav} from './siteLineageToHeaderNav.js';
import type {SiteLineagePayload} from './types.js';

describe('siteLineageToHeaderNav', () => {
    it('returns hub pages under the site root from page_content assets', () => {
        const items = siteLineageToHeaderNav(siteLineageFixture as SiteLineagePayload);

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            id: '470',
            title: "What's on",
            url: '/whats-on',
            assetType: 'page_content',
        });
        expect(items[0].children?.map((child) => child.title)).toEqual(['Events', 'Content page']);
    });

    it('omits hidden-linked siblings from header navigation', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: 'hub', type: 1},
                {
                    parent_asset_id: 'hub',
                    child_asset_id: 'visible-page',
                    type: 1,
                },
                {
                    parent_asset_id: 'hub',
                    child_asset_id: 'hidden-page',
                    type: 2,
                },
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'Site',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: 'hub',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    status: {code: 'live'},
                },
                {
                    id: 'visible-page',
                    type: 'page_content',
                    name: 'Visible page',
                    url: '/alerts-and-restrictions/visible-page',
                    status: {code: 'live'},
                },
                {
                    id: 'hidden-page',
                    type: 'page_content',
                    name: 'Hidden page',
                    url: '/alerts-and-restrictions/hidden-page',
                    status: {code: 'live'},
                },
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(1);
        expect(items[0].children?.map((child) => child.title)).toEqual(['Visible page']);
    });

    it('does not promote menu-linked descendants of hidden-linked hubs', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: '465',
                    child_asset_id: 'hidden-hub',
                    type: 2,
                },
                {
                    parent_asset_id: 'hidden-hub',
                    child_asset_id: 'visible-child',
                    type: 1,
                },
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'Site',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: 'hidden-hub',
                    type: 'page_content',
                    name: 'Hidden hub',
                    url: '/hidden-hub',
                    status: {code: 'live'},
                },
                {
                    id: 'visible-child',
                    type: 'page_content',
                    name: 'Visible child',
                    url: '/visible-child',
                    status: {code: 'live'},
                },
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(0);
    });

    it('includes page_standard hubs and children in header navigation', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: '465',
                    child_asset_id: 'standard-hub',
                    type: 1,
                },
                {
                    parent_asset_id: '465',
                    child_asset_id: 'content-hub',
                    type: 1,
                },
                {
                    parent_asset_id: 'content-hub',
                    child_asset_id: 'content-child',
                    type: 1,
                },
                {
                    parent_asset_id: 'standard-hub',
                    child_asset_id: 'standard-child',
                    type: 1,
                },
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'Site',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: 'standard-hub',
                    type: 'page_standard',
                    name: 'Standard hub',
                    url: '/standard-hub',
                    status: {code: 'live'},
                },
                {
                    id: 'content-hub',
                    type: 'page_content',
                    name: 'Content hub',
                    url: '/content-hub',
                    status: {code: 'live'},
                },
                {
                    id: 'content-child',
                    type: 'page_content',
                    name: 'Content child',
                    url: '/content-hub/content-child',
                    status: {code: 'live'},
                },
                {
                    id: 'standard-child',
                    type: 'page_standard',
                    name: 'Standard child',
                    url: '/standard-hub/standard-child',
                    status: {code: 'live'},
                },
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(2);
        const standardHub = items.find((item) => item.title === 'Standard hub');
        const contentHub = items.find((item) => item.title === 'Content hub');
        expect(standardHub?.assetType).toBe('page_standard');
        expect(standardHub?.children?.map((child) => child.title)).toEqual(['Standard child']);
        expect(standardHub?.children?.[0]?.assetType).toBe('page_standard');
        expect(contentHub?.assetType).toBe('page_content');
        expect(contentHub?.children?.map((child) => child.title)).toEqual(['Content child']);
        expect(contentHub?.children?.[0]?.assetType).toBe('page_content');
    });

    it('returns hub pages when site root asset is missing but children links exist', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: '465',
                    child_asset_id: '470',
                    type: 1,
                },
            ],
            assets: [
                {
                    id: '470',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    status: {code: 'live'},
                },
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Alerts and Restrictions',
            url: '/alerts-and-restrictions',
        });
    });

    it('excludes the homepage from top-level header navigation', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: '465',
                    child_asset_id: '295566',
                    type: 1,
                },
                {
                    parent_asset_id: '465',
                    child_asset_id: '295423',
                    type: 1,
                },
            ],
            assets: [
                {
                    id: '465',
                    type: 'site',
                    name: 'Site',
                    url: '/arts-rebuild-2026',
                    status: {code: 'live'},
                },
                {
                    id: '295566',
                    type: 'page_content',
                    name: 'Homepage',
                    short_name: 'homepage',
                    url: '/arts-rebuild-2026',
                    status: {code: 'live'},
                },
                {
                    id: '295423',
                    type: 'page_content',
                    name: 'Alerts and Restrictions',
                    url: '/arts-rebuild-2026/alerts-and-restrictions',
                    status: {code: 'live'},
                },
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Alerts and Restrictions');
        expect(items.map((item) => item.title)).not.toContain('Homepage');
    });

    it.each([
        ['Type 2 (hidden)', {type: 2}],
        ['Type 3', {type: 4}],
        ['notice', {type: 8}],
        ['reference', {link_type: 'reference'}],
        ['undefined type', {}],
    ])('omits a top-level hub whose link is %s', (_label, linkType) => {
        const page = (id: string, name: string) => ({
            id,
            type: 'page_content',
            name,
            url: `/${id}`,
            status: {code: 'live'},
        });
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: 'shown', type: 1},
                {parent_asset_id: '465', child_asset_id: 'dropped', ...linkType},
                {
                    parent_asset_id: 'dropped',
                    child_asset_id: 'under-dropped',
                    type: 1,
                },
            ],
            assets: [{id: '465', type: 'site', name: 'Site', url: '/'}, page('shown', 'Shown'), page('dropped', 'Dropped'), page('under-dropped', 'Under dropped')],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items.map((item) => item.title)).toEqual(['Shown']);
    });

    it.each([
        ['Type 2 (hidden)', {type: 2}],
        ['Type 3', {type: 4}],
        ['notice', {type: 8}],
        ['undefined type', {}],
    ])('omits a child page and its subtree when its link is %s', (_label, linkType) => {
        const page = (id: string, name: string) => ({
            id,
            type: 'page_content',
            name,
            url: `/hub/${id}`,
            status: {code: 'live'},
        });
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: 'hub', type: 1},
                {parent_asset_id: 'hub', child_asset_id: 'visible', type: 1},
                {parent_asset_id: 'hub', child_asset_id: 'dropped', ...linkType},
                {parent_asset_id: 'dropped', child_asset_id: 'grandchild', type: 1},
            ],
            assets: [
                {id: '465', type: 'site', name: 'Site', url: '/'},
                {...page('hub', 'Hub'), url: '/hub'},
                page('visible', 'Visible'),
                page('dropped', 'Dropped'),
                page('grandchild', 'Grandchild'),
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(1);
        expect(items[0].children?.map((child) => child.title)).toEqual(['Visible']);
    });

    it('uses the exact parent->child link when an asset has several parents', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: 'hub', type: 1},
                {parent_asset_id: '465', child_asset_id: 'other-hub', type: 1},
                {parent_asset_id: 'hub', child_asset_id: 'shared', type: 1},
                {parent_asset_id: 'other-hub', child_asset_id: 'shared', type: 2},
            ],
            assets: [
                {id: '465', type: 'site', name: 'Site', url: '/'},
                {id: 'hub', type: 'page_content', name: 'Hub', url: '/hub'},
                {id: 'other-hub', type: 'page_content', name: 'Other', url: '/other'},
                {id: 'shared', type: 'page_content', name: 'Shared', url: '/shared'},
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items.find((item) => item.id === 'hub')?.children).toHaveLength(1);
        expect(items.find((item) => item.id === 'other-hub')?.children).toBeUndefined();
    });

    it("includes page_redirect hubs and children using the redirect's own URL", () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: '465', child_asset_id: 'redirect-hub', type: 1},
                {parent_asset_id: 'redirect-hub', child_asset_id: 'redirect-child', type: 1},
            ],
            assets: [
                {id: '465', type: 'site', name: 'Site', url: '/'},
                {
                    id: 'redirect-hub',
                    type: 'page_redirect',
                    name: 'Old hub',
                    url: '/old-hub',
                    status: {code: 'live'},
                },
                {
                    id: 'redirect-child',
                    type: 'page_redirect',
                    name: 'Old child',
                    url: '/old-hub/old-child',
                    status: {code: 'live'},
                },
            ],
        };

        const items = siteLineageToHeaderNav(lineage);

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Old hub',
            url: '/old-hub',
            assetType: 'page_redirect',
        });
        expect(items[0].children).toEqual([
            expect.objectContaining({
                title: 'Old child',
                url: '/old-hub/old-child',
                assetType: 'page_redirect',
            }),
        ]);
    });

    it('excludes archived page_redirect assets from header navigation', () => {
        const lineage: SiteLineagePayload = {
            links: [{parent_asset_id: '465', child_asset_id: 'archived-redirect', type: 1}],
            assets: [
                {id: '465', type: 'site', name: 'Site', url: '/'},
                {
                    id: 'archived-redirect',
                    type: 'page_redirect',
                    name: 'Archived redirect',
                    url: '/archived',
                    status: {code: 'archived'},
                },
            ],
        };

        expect(siteLineageToHeaderNav(lineage)).toEqual([]);
    });

    it('returns an empty array when the site root is missing from lineage', () => {
        const items = siteLineageToHeaderNav({links: [], assets: []});

        expect(items).toEqual([]);
    });
});
