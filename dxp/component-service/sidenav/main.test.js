import {beforeEach, describe, expect, it, vi} from 'vitest';
import SidenavComponent from './main.js';
import {fetchSiteLineage} from '../../utils/matrix/siteLineage/fetchSiteLineage.ts';

/**
 * Tests for the Side navigation component.
 *
 * Covers the navigation structure from a lineage tree, the top-level page
 * case, empty output in live mode, edit-mode targets, the preview fixture,
 * and attribute and text escaping. The lineage helper is mocked, so no test
 * calls Content API or AMAPI.
 */

vi.mock('../../utils/matrix/siteLineage/fetchSiteLineage.ts', async (importOriginal) => ({
    ...(await importOriginal()),
    fetchSiteLineage: vi.fn(),
}));

const site = {id: '1', type: 'site', name: 'Site', url: '/', status: {code: 'live'}};
const page = (id, name, url) => ({id, type: 'page', name, url, status: {code: 'live'}});
const under = (parent, child) => ({parent_asset_id: parent, child_asset_id: child});

// Site > Parent > (Sibling one, Current > (Kid one, Kid two), Sibling two)
const buildLineage = () => ({
    assets: [
        site,
        page('100', 'Parent', '/parent'),
        page('101', 'Sibling one', '/parent/sibling-one'),
        page('102', 'Current', '/parent/current'),
        page('103', 'Kid one', '/parent/current/kid-one'),
        page('104', 'Kid two', '/parent/current/kid-two'),
        page('105', 'Sibling two', '/parent/sibling-two'),
        {
            id: '106',
            type: 'page_redirect',
            name: 'Redirect sibling',
            url: '/parent/redirect',
            status: {code: 'live'},
        },
    ],
    links: [
        under('1', '100'),
        under('100', '101'),
        under('100', '102'),
        under('102', '103'),
        under('102', '104'),
        under('100', '105'),
        {parent_asset_id: '100', child_asset_id: '106', type: 1},
    ],
});

const input = {collapseTitle: 'In this section', showChildren: true};
const liveOn = (assetId) => ({ctx: {assetId}, env: {}});
const editOn = (assetId) => ({ctx: {assetId, editor: true}, env: {}});

beforeEach(() => {
    vi.mocked(fetchSiteLineage).mockReset();
    vi.mocked(fetchSiteLineage).mockResolvedValue(buildLineage());
});

describe('Side navigation', () => {
    describe('navigation structure', () => {
        it('renders the direct parent as the title and its children as the list', async () => {
            const rendered = await SidenavComponent.main(input, liveOn('102'));
            expect(rendered).toContain('<h2 class="nav-title"><a class="nav-link" href="/parent">Parent</a></h2>');
            expect(rendered).toContain('<li class="nav-item"><a class="nav-link" href="/parent/sibling-one">Sibling one</a></li>');
            expect(rendered).toContain('<li class="nav-item"><a class="nav-link" href="/parent/sibling-two">Sibling two</a></li>');
        });

        it('marks the current page active and expands its children', async () => {
            const rendered = await SidenavComponent.main(input, liveOn('102'));
            expect(rendered).toContain('<span class="nav-link" aria-current="page">Current</span>');
            expect(rendered).toContain('<li class="nav-item"><a class="nav-link" href="/parent/current/kid-one">Kid one</a></li>');
            expect(rendered).toContain('Kid two');
        });

        it("hides the current page's children when showChildren is false", async () => {
            const rendered = await SidenavComponent.main({...input, showChildren: false}, liveOn('102'));
            expect(rendered).toContain('aria-current="page">Current</span>');
            expect(rendered).not.toContain('Kid one');
        });

        it('titles a top-level page with itself and lists its own children', async () => {
            const rendered = await SidenavComponent.main(input, liveOn('100'));
            expect(rendered).toContain('<h2 class="nav-title"><a class="nav-link" href="/parent">Parent</a></h2>');
            expect(rendered).toContain('Sibling one');
            expect(rendered).toContain('Current');
            expect(rendered).not.toContain('aria-current');
        });

        it('requests lineage with the component utilities', async () => {
            const utilities = liveOn('102');
            await SidenavComponent.main(input, utilities);
            expect(fetchSiteLineage).toHaveBeenCalledWith(utilities);
        });

        it('lists page_redirect siblings alongside standard pages', async () => {
            const rendered = await SidenavComponent.main(input, liveOn('102'));

            expect(rendered).toContain('<li class="nav-item"><a class="nav-link" href="/parent/redirect">Redirect sibling</a></li>');
        });
    });

    describe('empty output', () => {
        it('returns empty output in live mode when the page is not in the section', async () => {
            expect(await SidenavComponent.main(input, liveOn('999'))).toBe('');
        });

        it('returns empty output in live mode when the lineage request fails', async () => {
            vi.mocked(fetchSiteLineage).mockRejectedValue(new Error('lineage fetch: 500'));
            expect(await SidenavComponent.main(input, liveOn('102'))).toBe('');
        });

        it('keeps the markup in edit mode when there is no navigation', async () => {
            const rendered = await SidenavComponent.main(input, editOn('999'));
            expect(rendered).toContain('data-sq-field="collapseTitle"');
            expect(rendered).toContain('qld-side-navigation');
        });
    });

    describe('edit mode', () => {
        it('omits data-sq-field in live output', async () => {
            const rendered = await SidenavComponent.main(input, liveOn('102'));
            expect(rendered).not.toContain('data-sq-field');
        });

        it('sets data-sq-field on the collapse title in edit mode', async () => {
            const rendered = await SidenavComponent.main(input, editOn('102'));
            expect(rendered).toContain('data-sq-field="collapseTitle"');
            expect(rendered).toContain('In this section');
        });
    });

    describe('preview fixture', () => {
        it('uses the preview fixture without a page asset, as Storybook does', async () => {
            const rendered = await SidenavComponent.main(input);
            expect(rendered).toContain('href="/parent-page">Parent page</a>');
            expect(rendered).toContain('aria-current="page">Current page</span>');
            expect(fetchSiteLineage).not.toHaveBeenCalled();
        });

        it('uses the preview fixture in the editor when there is no page asset', async () => {
            const rendered = await SidenavComponent.main(input, {ctx: {editor: true}});
            expect(rendered).toContain('Parent page');
        });

        it('returns empty output in live mode without a page asset', async () => {
            expect(await SidenavComponent.main(input, {env: {}})).toBe('');
            expect(fetchSiteLineage).not.toHaveBeenCalled();
        });
    });

    describe('escaping', () => {
        it('escapes wrapperClasses that try to close the class attribute', async () => {
            const rendered = await SidenavComponent.main({...input, wrapperClasses: 'row" onclick="alert(1)'}, liveOn('102'));
            expect(rendered).toContain('class="qld-side-navigation row&quot; onclick=&quot;alert(1)"');
            expect(rendered).not.toContain('onclick="');
        });

        it('escapes a link URL that tries to close the href attribute', async () => {
            const lineage = buildLineage();
            lineage.assets = lineage.assets.map((asset) => (asset.id === '101' ? {...asset, url: '/parent/sibling-one" onmouseover="alert(1)'} : asset));
            vi.mocked(fetchSiteLineage).mockResolvedValue(lineage);

            const rendered = await SidenavComponent.main(input, liveOn('102'));
            expect(rendered).toContain('href="/parent/sibling-one&quot; onmouseover=&quot;alert(1)"');
            expect(rendered).not.toContain('onmouseover="');
        });

        it('does not render markup in a page name', async () => {
            const lineage = buildLineage();
            lineage.assets = lineage.assets.map((asset) => (asset.id === '101' ? {...asset, name: '<img src=x onerror=alert(1)>Sibling one'} : asset));
            vi.mocked(fetchSiteLineage).mockResolvedValue(lineage);

            const rendered = await SidenavComponent.main(input, liveOn('102'));
            expect(rendered).not.toContain('onerror');
        });
    });
});
