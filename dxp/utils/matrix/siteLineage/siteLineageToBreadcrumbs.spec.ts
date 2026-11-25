import {describe, it, expect} from 'vitest';
import pageContentFixture from './fixtures/site-lineage-page-content.json';
import {parseHomepagePathsFromEnv} from './homepagePaths.js';
import {isHomepagePath, siteLineageToBreadcrumbs} from './siteLineageToBreadcrumbs.js';
import type {SiteLineagePayload} from './types.js';

const pageContentLineage = pageContentFixture as SiteLineagePayload;

describe('[siteLineageToBreadcrumbs]', () => {
    it('returns ancestor chain for a deeply nested page', () => {
        const breadcrumbs = siteLineageToBreadcrumbs(pageContentLineage, {
            assetId: '472',
        });

        expect(breadcrumbs).toEqual([
            {title: 'Home', url: '/'},
            {title: "What's on", url: '/whats-on'},
            {title: 'Content page', url: '/whats-on/content-page'},
        ]);
    });

    it('resolves current asset by page URL when asset ID is missing', () => {
        const breadcrumbs = siteLineageToBreadcrumbs(pageContentLineage, {
            pageUrl: '/whats-on/content-page',
        });

        expect(breadcrumbs).toHaveLength(3);
        expect(breadcrumbs[2]).toMatchObject({
            title: 'Content page',
            url: '/whats-on/content-page',
        });
    });

    it('labels the site root breadcrumb as Home', () => {
        const breadcrumbs = siteLineageToBreadcrumbs(pageContentLineage, {
            assetId: '472',
        });

        expect(breadcrumbs[0]).toEqual({title: 'Home', url: '/'});
    });

    it('returns empty trail on production homepage', () => {
        const lineage: SiteLineagePayload = {
            links: [],
            assets: [
                {
                    id: 'home',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
            ],
        };

        expect(
            siteLineageToBreadcrumbs(lineage, {
                assetId: 'home',
                pageUrl: '/',
            }),
        ).toEqual([]);
    });

    it('returns empty trail on Matrix dev homepage path when API_HOME_PATHS includes it', () => {
        const devHomePaths = parseHomepagePathsFromEnv('/arts-rebuild-2026');
        const lineage: SiteLineagePayload = {
            links: [],
            assets: [
                {
                    id: 'dev-root',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/arts-rebuild-2026',
                    status: {code: 'live'},
                },
            ],
        };

        expect(
            siteLineageToBreadcrumbs(lineage, {
                assetId: 'dev-root',
                pageUrl: '/arts-rebuild-2026',
                homepagePaths: devHomePaths,
            }),
        ).toEqual([]);

        expect(
            siteLineageToBreadcrumbs(lineage, {
                assetId: 'dev-root',
                pageUrl: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026',
                homepagePaths: devHomePaths,
            }),
        ).toEqual([]);
    });

    it('suppresses breadcrumbs when current page title matches 404 patterns', () => {
        const lineage: SiteLineagePayload = {
            links: [{parent_asset_id: 'site', child_asset_id: '404-page', type: 1}],
            assets: [
                {
                    id: 'site',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '404-page',
                    type: 'page_content',
                    name: 'Page not found',
                    url: '/missing-page',
                    status: {code: 'live'},
                },
            ],
        };

        expect(siteLineageToBreadcrumbs(lineage, {assetId: '404-page'})).toEqual([]);
    });

    it('includes a page_redirect ancestor in the breadcrumb trail', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'site', child_asset_id: 'redirect', type: 1},
                {parent_asset_id: 'redirect', child_asset_id: 'child', type: 1},
            ],
            assets: [
                {
                    id: 'site',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: 'redirect',
                    type: 'page_redirect',
                    name: 'Moved section',
                    url: '/moved-section',
                    status: {code: 'live'},
                },
                {
                    id: 'child',
                    type: 'page_content',
                    name: 'Child page',
                    url: '/moved-section/child',
                    status: {code: 'live'},
                },
            ],
        };

        const trail = siteLineageToBreadcrumbs(lineage, {assetId: 'child'});

        expect(trail.map((item) => item.title)).toContain('Moved section');
        expect(trail.find((item) => item.title === 'Moved section')?.url).toBe('/moved-section');
    });

    it('suppresses breadcrumbs when an ancestor title matches 404 patterns', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {parent_asset_id: 'site', child_asset_id: '404-proxy', type: 1},
                {parent_asset_id: '404-proxy', child_asset_id: 'child', type: 1},
            ],
            assets: [
                {
                    id: 'site',
                    type: 'site',
                    name: 'NSW RFS Website',
                    url: '/',
                    status: {code: 'live'},
                },
                {
                    id: '404-proxy',
                    type: 'page_content',
                    name: '404 Proxy',
                    url: '/404-proxy',
                    status: {code: 'live'},
                },
                {
                    id: 'child',
                    type: 'page_content',
                    name: 'Child page',
                    url: '/404-proxy/child',
                    status: {code: 'live'},
                },
            ],
        };

        expect(siteLineageToBreadcrumbs(lineage, {assetId: 'child'})).toEqual([]);
    });

    it('skips hidden-linked ancestors but includes the current page', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: 'section',
                    child_asset_id: 'hidden-page',
                    type: 2,
                },
                {
                    parent_asset_id: 'hidden-page',
                    child_asset_id: 'visible-child',
                    type: 1,
                },
            ],
            assets: [
                {
                    id: 'section',
                    type: 'page_content',
                    name: 'Section',
                    url: '/section',
                    status: {code: 'live'},
                },
                {
                    id: 'hidden-page',
                    type: 'page_content',
                    name: 'Hidden',
                    url: '/section/hidden',
                    status: {code: 'live'},
                },
                {
                    id: 'visible-child',
                    type: 'page_content',
                    name: 'Visible Child',
                    url: '/section/visible-child',
                    status: {code: 'live'},
                },
            ],
        };

        expect(siteLineageToBreadcrumbs(lineage, {assetId: 'visible-child'})).toEqual([
            {title: 'Section', url: '/section'},
            {title: 'Visible Child', url: '/section/visible-child'},
        ]);
    });

    it('includes hidden-linked asset when it is the current page', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: 'section',
                    child_asset_id: 'hidden-page',
                    type: 2,
                },
            ],
            assets: [
                {
                    id: 'section',
                    type: 'page_content',
                    name: 'Section',
                    url: '/section',
                    status: {code: 'live'},
                },
                {
                    id: 'hidden-page',
                    type: 'page_content',
                    name: 'Hidden',
                    url: '/section/hidden',
                    status: {code: 'live'},
                },
            ],
        };

        expect(siteLineageToBreadcrumbs(lineage, {assetId: 'hidden-page'})).toEqual([
            {title: 'Section', url: '/section'},
            {title: 'Hidden', url: '/section/hidden'},
        ]);
    });
    it('drops a folder whose link to the next page is hidden, keeping both pages', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: 'page-one',
                    child_asset_id: 'folder',
                    link_type: 'menu',
                },
                {
                    parent_asset_id: 'folder',
                    child_asset_id: 'page-two',
                    link_type: 'hidden',
                },
            ],
            assets: [
                {
                    id: 'page-one',
                    type: 'page_content',
                    name: 'Page one',
                    url: '/page-one',
                    status: {code: 'live'},
                },
                {
                    id: 'folder',
                    type: 'folder',
                    name: 'Folder',
                    url: '/page-one/folder',
                    status: {code: 'live'},
                },
                {
                    id: 'page-two',
                    type: 'page_content',
                    name: 'Page two',
                    url: '/page-one/folder/page-two',
                    status: {code: 'live'},
                },
            ],
        };

        expect(siteLineageToBreadcrumbs(lineage, {assetId: 'page-two'})).toEqual([
            {title: 'Page one', url: '/page-one'},
            {title: 'Page two', url: '/page-one/folder/page-two'},
        ]);
    });

    it('keeps a page whose link to the next trail item is hidden', () => {
        const lineage: SiteLineagePayload = {
            links: [
                {
                    parent_asset_id: 'page-one',
                    child_asset_id: 'folder',
                    link_type: 'menu',
                },
                {
                    parent_asset_id: 'folder',
                    child_asset_id: 'page-two',
                    link_type: 'menu',
                },
                {
                    parent_asset_id: 'page-two',
                    child_asset_id: 'page-three',
                    link_type: 'hidden',
                },
            ],
            assets: [
                {
                    id: 'page-one',
                    type: 'page_content',
                    name: 'Page one',
                    url: '/page-one',
                    status: {code: 'live'},
                },
                {
                    id: 'folder',
                    type: 'folder',
                    name: 'Folder',
                    url: '/page-one/folder',
                    status: {code: 'live'},
                },
                {
                    id: 'page-two',
                    type: 'page_content',
                    name: 'Page two',
                    url: '/page-one/folder/page-two',
                    status: {code: 'live'},
                },
                {
                    id: 'page-three',
                    type: 'page_content',
                    name: 'Page three',
                    url: '/page-one/folder/page-two/page-three',
                    status: {code: 'live'},
                },
            ],
        };

        expect(siteLineageToBreadcrumbs(lineage, {assetId: 'page-three'})).toEqual([
            {title: 'Page one', url: '/page-one'},
            {title: 'Folder', url: '/page-one/folder'},
            {title: 'Page two', url: '/page-one/folder/page-two'},
            {title: 'Page three', url: '/page-one/folder/page-two/page-three'},
        ]);
    });
});

describe('[isHomepagePath]', () => {
    it('recognizes the site root by default', () => {
        expect(isHomepagePath('/')).toBe(true);
        expect(isHomepagePath('/fire-information')).toBe(false);
        expect(isHomepagePath('/arts-rebuild-2026')).toBe(false);
    });

    it('recognizes paths from API_HOME_PATHS parsing', () => {
        const devHomePaths = parseHomepagePathsFromEnv('/arts-rebuild-2026');
        expect(isHomepagePath('/arts-rebuild-2026', devHomePaths)).toBe(true);
        expect(isHomepagePath('https://staging-web.matrix.squiz.cloud/arts-rebuild-2026', devHomePaths)).toBe(true);
    });
});
