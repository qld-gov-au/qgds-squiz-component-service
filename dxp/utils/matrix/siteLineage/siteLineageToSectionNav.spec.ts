import {describe, expect, it} from 'vitest';
import {siteLineageToSectionNav} from './siteLineageToSectionNav.js';
import type {SiteLineageAsset, SiteLineagePayload} from './types.js';

const page = (id: string, name: string, path: string): SiteLineageAsset => ({
    id,
    type: 'page_content',
    name,
    url: path,
    status: {code: 'live'},
});

const siteRoot: SiteLineageAsset = {
    id: 'home',
    type: 'site',
    name: 'Home',
    url: '/',
    status: {code: 'live'},
};

describe('[siteLineageToSectionNav] link types', () => {
    it('shows Type 1 children under the section root', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'home', child_asset_id: 'section', type: 1},
                {parent_asset_id: 'section', child_asset_id: 'child', type: 1},
            ],
            assets: [siteRoot, page('section', 'Section', '/section'), page('child', 'Child', '/section/child')],
        };

        const items = siteLineageToSectionNav(lineage, {assetId: 'child'});

        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Section');
        expect(items[0].children?.map((child) => child.title)).toEqual(['Child']);
    });

    it.each([
        ['Type 2 (hidden)', {type: 2}],
        ['Type 3', {type: 4}],
        ['notice', {type: 8}],
        ['reference', {link_type: 'reference'}],
        ['undefined type', {}],
    ])('omits a child and its subtree when its link is %s', (_label, linkType) => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'home', child_asset_id: 'section', type: 1},
                {parent_asset_id: 'section', child_asset_id: 'visible', type: 1},
                {
                    parent_asset_id: 'section',
                    child_asset_id: 'dropped',
                    ...linkType,
                },
                {parent_asset_id: 'dropped', child_asset_id: 'grandchild', type: 1},
            ],
            assets: [
                siteRoot,
                page('section', 'Section', '/section'),
                page('visible', 'Visible', '/section/visible'),
                page('dropped', 'Dropped', '/section/dropped'),
                page('grandchild', 'Grandchild', '/section/dropped/grandchild'),
            ],
        };

        const items = siteLineageToSectionNav(lineage, {assetId: 'visible'});

        expect(items).toHaveLength(1);
        expect(items[0].children?.map((child) => child.title)).toEqual(['Visible']);
    });

    it('uses the exact parent->child link when an asset has several parents', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'home', child_asset_id: 'section', type: 1},
                {parent_asset_id: 'section', child_asset_id: 'a', type: 1},
                {parent_asset_id: 'section', child_asset_id: 'b', type: 1},
                {parent_asset_id: 'a', child_asset_id: 'shared', type: 1},
                {parent_asset_id: 'b', child_asset_id: 'shared', type: 2},
            ],
            assets: [siteRoot, page('section', 'Section', '/section'), page('a', 'A', '/section/a'), page('b', 'B', '/section/b'), page('shared', 'Shared', '/section/a/shared')],
        };

        const items = siteLineageToSectionNav(lineage, {assetId: 'a'});
        const children = items[0].children ?? [];

        expect(children.find((item) => item.id === 'a')?.children).toHaveLength(1);
        expect(children.find((item) => item.id === 'b')?.children).toBeUndefined();
    });

    it('includes page_redirect assets in section navigation', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'home', child_asset_id: 'section', type: 1},
                {parent_asset_id: 'section', child_asset_id: 'redirect', type: 1},
                {parent_asset_id: 'section', child_asset_id: 'child', type: 1},
            ],
            assets: [
                siteRoot,
                page('section', 'Section', '/section'),
                {
                    id: 'redirect',
                    type: 'page_redirect',
                    name: 'Moved page',
                    url: '/section/moved',
                    status: {code: 'live'},
                },
                page('child', 'Child', '/section/child'),
            ],
        };

        const items = siteLineageToSectionNav(lineage, {assetId: 'child'});

        expect(items[0].children?.map((child) => child.title)).toEqual(['Moved page', 'Child']);
    });

    it('keeps the section root when it is the current page, regardless of its own link type', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'home', child_asset_id: 'section', type: 2},
                {parent_asset_id: 'section', child_asset_id: 'child', type: 1},
            ],
            assets: [siteRoot, page('section', 'Section', '/section'), page('child', 'Child', '/section/child')],
        };

        const items = siteLineageToSectionNav(lineage, {assetId: 'section'});

        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Section');
        expect(items[0].children?.map((child) => child.title)).toEqual(['Child']);
    });
});

// site > page one > folder > page two (or page three), with links as given.
function lineageWith(links: SiteLineagePayload['links']): SiteLineagePayload {
    return {
        links,
        assets: [
            {
                id: '1',
                type: 'site',
                name: 'Site',
                url: '/',
                status: {code: 'live'},
            },
            {
                id: '10',
                type: 'page_content',
                name: 'Page one',
                url: '/page-one',
                status: {code: 'live'},
            },
            {
                id: '11',
                type: 'folder',
                name: 'Folder',
                url: '/page-one/folder',
                status: {code: 'live'},
            },
            {
                id: '12',
                type: 'page_content',
                name: 'Page two',
                url: '/page-one/folder/page-two',
                status: {code: 'live'},
            },
            {
                id: '13',
                type: 'page_content',
                name: 'Page three',
                url: '/page-one/folder/page-three',
                status: {code: 'live'},
            },
        ],
    };
}

describe('[siteLineageToSectionNav] folders with TYPE_2 links', () => {
    it('drops a folder whose child links are all hidden and lists its pages in its place', () => {
        const lineage = lineageWith([
            {parent_asset_id: '1', child_asset_id: '10', link_type: 'menu'},
            {parent_asset_id: '10', child_asset_id: '11', link_type: 'menu'},
            {parent_asset_id: '11', child_asset_id: '12', link_type: 'hidden'},
        ]);

        expect(siteLineageToSectionNav(lineage, {assetId: '12'})).toEqual([
            {
                id: '10',
                title: 'Page one',
                url: '/page-one',
                assetType: 'page_content',
                children: [
                    {
                        id: '12',
                        title: 'Page two',
                        url: '/page-one/folder/page-two',
                        assetType: 'page_content',
                    },
                ],
            },
        ]);
    });

    it('does not list a folder hidden from its parent, or search inside it', () => {
        const lineage = lineageWith([
            {parent_asset_id: '1', child_asset_id: '10', link_type: 'menu'},
            {parent_asset_id: '10', child_asset_id: '11', link_type: 'hidden'},
            {parent_asset_id: '11', child_asset_id: '12', link_type: 'hidden'},
        ]);

        expect(siteLineageToSectionNav(lineage, {assetId: '10'})).toEqual([
            {
                id: '10',
                title: 'Page one',
                url: '/page-one',
                assetType: 'page_content',
            },
        ]);
    });

    it('keeps a folder that still has a menu-linked child, and keeps its hidden child out', () => {
        const lineage = lineageWith([
            {parent_asset_id: '1', child_asset_id: '10', link_type: 'menu'},
            {parent_asset_id: '10', child_asset_id: '11', link_type: 'menu'},
            {parent_asset_id: '11', child_asset_id: '12', link_type: 'hidden'},
            {parent_asset_id: '11', child_asset_id: '13', link_type: 'menu'},
        ]);

        expect(siteLineageToSectionNav(lineage, {assetId: '10'})).toEqual([
            {
                id: '10',
                title: 'Page one',
                url: '/page-one',
                assetType: 'page_content',
                children: [
                    {
                        id: '11',
                        title: 'Folder',
                        url: '/page-one/folder',
                        assetType: 'folder',
                        children: [
                            {
                                id: '13',
                                title: 'Page three',
                                url: '/page-one/folder/page-three',
                                assetType: 'page_content',
                            },
                        ],
                    },
                ],
            },
        ]);
    });

    it('keeps a folder with no child links as a plain item', () => {
        const lineage = lineageWith([
            {parent_asset_id: '1', child_asset_id: '10', link_type: 'menu'},
            {parent_asset_id: '10', child_asset_id: '11', link_type: 'menu'},
        ]);

        expect(siteLineageToSectionNav(lineage, {assetId: '10'})).toEqual([
            {
                id: '10',
                title: 'Page one',
                url: '/page-one',
                assetType: 'page_content',
                children: [
                    {
                        id: '11',
                        title: 'Folder',
                        url: '/page-one/folder',
                        assetType: 'folder',
                    },
                ],
            },
        ]);
    });
});

describe('[siteLineageToSectionNav] untypedLinksVisible', () => {
    const untypedLineage = (): SiteLineagePayload => ({
        links: [
            {parent_asset_id: '1', child_asset_id: '10', link_type: 'menu'},
            {parent_asset_id: '10', child_asset_id: '11'},
        ],
        assets: [
            {
                id: '1',
                type: 'site',
                name: 'Site',
                url: '/',
                status: {code: 'live'},
            },
            {
                id: '10',
                type: 'page_content',
                name: 'Parent',
                url: '/parent',
                status: {code: 'live'},
            },
            {
                id: '11',
                type: 'page_content',
                name: 'Untyped child',
                url: '/parent/untyped-child',
                status: {code: 'live'},
            },
        ],
    });

    it('hides an untyped child by default (menu policy for header and breadcrumbs)', () => {
        const items = siteLineageToSectionNav(untypedLineage(), {
            assetId: '11',
        });
        expect(items[0].children ?? []).toEqual([]);
    });

    it('shows an untyped child when untypedLinksVisible is set (sidenav)', () => {
        const items = siteLineageToSectionNav(untypedLineage(), {
            assetId: '11',
            untypedLinksVisible: true,
        });
        expect(items[0].children?.map((child) => child.title)).toEqual(['Untyped child']);
    });
});
