import {beforeEach, describe, expect, it, vi} from 'vitest';
import CardListing from './main';
import manifest from './manifest.json';
import previewData from './example.data.json';
import type {DxpComponentInfo} from '../../types/dxp';
import type {NavigationCardItem} from '../../utils/matrix/siteLineage/types';
import type {CardListingInput, CardListingSettings} from './types';
import {resolveChildCards} from './lib/resolveChildCards';

/**
 * Tests for the Cards Listing component.
 *
 * The child lookup is mocked, so these tests cover the markup, the display
 * modes, the intro heading and escaping without any Matrix calls. The lookup
 * itself is covered in lib/resolveChildCards.test.ts.
 */

vi.mock('./lib/resolveChildCards', () => ({
    resolveChildCards: vi.fn(),
}));

const mockedChildren = vi.mocked(resolveChildCards);

const baseSettings: CardListingSettings = {
    columns: '2',
    variant: 'default',
    display: 'name',
    isEqualHeight: true,
};

const child = (title: string, overrides: Partial<NavigationCardItem> = {}): NavigationCardItem => ({
    id: title.toLowerCase(),
    title,
    url: '/page',
    ...overrides,
});

const render = async (children: NavigationCardItem[], overrides: Partial<CardListingInput> = {}, info?: DxpComponentInfo) => {
    mockedChildren.mockResolvedValue(children);
    return CardListing.main({listing: {source: 'current'}, settings: baseSettings, ...overrides}, info);
};

const editor: DxpComponentInfo = {ctx: {editor: true}};

describe('Cards Listing', () => {
    beforeEach(() => {
        mockedChildren.mockReset();
    });

    describe('empty output', () => {
        it('returns empty output when there are no child pages', async () => {
            expect(await render([])).toBe('');
        });

        it('returns empty output without input', async () => {
            mockedChildren.mockResolvedValue([]);
            expect(await CardListing.main(undefined)).toBe('');
            expect(await CardListing.main(null)).toBe('');
        });

        it('skips the heading when there are no child pages', async () => {
            const rendered = await render([], {intro: {title: 'Explore'}});

            expect(rendered).toBe('');
        });
    });

    describe('list markup', () => {
        it('renders one list item per child in an unstyled list', async () => {
            const rendered = await render([child('One'), child('Two'), child('Three')]);

            expect(rendered).toContain('<ul class="row row-cols-1 row-cols-md-2 g-4 list-unstyled">');
            expect(rendered.match(/<li[\s>]/g)).toHaveLength(3);
            expect(rendered.match(/class="card-title"/g)).toHaveLength(3);
        });

        it('wraps the output in the card-listing class', async () => {
            const rendered = await render([child('One')]);

            expect(rendered).toContain('<div class="card-listing">');
        });
    });

    describe('name display', () => {
        it('renders the requested name markup for one card', async () => {
            const rendered = await render([child('Page name', {url: '/page'})]);

            expect(rendered).toContain(`<div class="col">
      <div class="card card-default default card-single-action card-arrow h-100">
        <div class="card-body">
          <h3 class="card-title"><a href="/page" class="stretched-link">Page name</a></h3>
          <div class="qld-icon qld-icon-md qld-icon-arrow-right"></div>
        </div>
      </div>
    </div>`);
        });

        it('shows the arrow only in name mode', async () => {
            const rendered = await render([child('One')]);

            expect(rendered).toContain('card-arrow');
            expect(rendered).toContain('qld-icon-arrow-right');
            expect(rendered).not.toContain('card-text');
        });
    });

    describe('name and description display', () => {
        it('renders the description card markup for one card', async () => {
            const rendered = await render([child('Page name', {url: '/page', description: 'Card body text'})], {settings: {...baseSettings, display: 'name-and-description'}});

            expect(rendered).toContain(`<div class="col">
      <div class="card card-default default card-single-action h-100">
        <div class="card-body">
          <h3 class="card-title"><a href="/page" class="stretched-link">Page name</a></h3>
          <div class="card-text">Card body text</div>
        </div>
      </div>
    </div>`);
        });

        it('does not show the arrow in description mode', async () => {
            const rendered = await render([child('One', {description: 'Body'})], {settings: {...baseSettings, display: 'name-and-description'}});

            expect(rendered).not.toContain('card-arrow');
            expect(rendered).not.toContain('qld-icon-arrow-right');
            expect(rendered).toContain('<div class="card-text">Body</div>');
        });

        it('omits the card-text block when the description is empty', async () => {
            const rendered = await render([child('One', {description: ''})], {settings: {...baseSettings, display: 'name-and-description'}});

            expect(rendered).not.toContain('card-text');
            expect(rendered).toContain('stretched-link');
        });
    });

    describe('stretched link', () => {
        it('makes every card clickable in both display modes', async () => {
            const name = await render([child('One')]);
            const withDescription = await render([child('One', {description: 'Body'})], {settings: {...baseSettings, display: 'name-and-description'}});

            expect(name).toContain('class="stretched-link"');
            expect(withDescription).toContain('class="stretched-link"');
        });
    });

    describe('styles', () => {
        it('wraps the cards in the card-listing class that the shadow styles target', async () => {
            const rendered = await render([child('One')]);

            expect(rendered).toContain('<div class="card-listing">');
        });
    });

    describe('columns', () => {
        it.each([
            ['1', 'row row-cols-1 g-4 list-unstyled'],
            ['2', 'row row-cols-1 row-cols-md-2 g-4 list-unstyled'],
            ['3', 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 list-unstyled'],
            ['9', 'row row-cols-1 row-cols-md-2 g-4 list-unstyled'],
        ])('columns %s uses the matching row classes', async (columns, classes) => {
            const rendered = await render([child('One')], {
                settings: {...baseSettings, columns: columns as '1' | '2' | '3'},
            });

            expect(rendered).toContain(`<ul class="${classes}">`);
        });
    });

    describe('equal height', () => {
        it('makes list items flex and cards full height when on', async () => {
            const rendered = await render([child('One')]);

            expect(rendered).toContain('<li class="d-flex">');
            expect(rendered).toContain('h-100');
        });

        it('leaves list items and cards at their natural height when off', async () => {
            const rendered = await render([child('One')], {
                settings: {...baseSettings, isEqualHeight: false},
            });

            expect(rendered).not.toContain('d-flex');
            expect(rendered).not.toContain('h-100');
        });
    });

    describe('intro heading', () => {
        it('renders the title as an h2 above the list by default', async () => {
            const rendered = await render([child('One')], {
                intro: {title: 'Explore'},
            });

            expect(rendered).toContain('<h2 class="mb-4">Explore</h2>');
            expect(rendered.indexOf('<h2')).toBeLessThan(rendered.indexOf('<ul'));
        });

        it('uses the chosen heading tag', async () => {
            const rendered = await render([child('One')], {
                intro: {headingTag: 'h4', title: 'Explore'},
            });

            expect(rendered).toContain('<h4 class="mb-4">Explore</h4>');
        });

        it('falls back to h2 for a heading tag that is not allowed', async () => {
            const rendered = await render([child('One')], {
                intro: {headingTag: 'script' as 'h2', title: 'Explore'},
            });

            expect(rendered).toContain('<h2 class="mb-4">Explore</h2>');
            expect(rendered).not.toContain('<script');
        });

        it('omits the heading without a title in live mode', async () => {
            const rendered = await render([child('One')], {intro: {title: ''}});

            expect(rendered).not.toContain('<h2');
            expect(rendered).not.toContain('mb-4');
        });

        it('keeps the heading target in edit mode without a title', async () => {
            const rendered = await render([child('One')], {intro: {title: ''}}, editor);

            expect(rendered).toContain('<h2 class="mb-4" data-sq-field="intro.title">');
        });

        it('escapes HTML in the title', async () => {
            const rendered = await render([child('One')], {
                intro: {title: '<img src=x onerror="alert(1)">Explore'},
            });

            expect(rendered).toContain('Explore');
            expect(rendered).not.toContain('onerror');
        });
    });

    describe('escaping', () => {
        it('removes script markup from a child title', async () => {
            const rendered = await render([child('<script>alert(1)</script>Card')]);

            expect(rendered).not.toContain('<script');
            expect(rendered).toContain('Card');
        });

        it('escapes HTML in a description', async () => {
            const rendered = await render([child('One', {description: '<img src=x onerror=alert(1)>Body'})], {settings: {...baseSettings, display: 'name-and-description'}});

            expect(rendered).not.toContain('onerror');
        });

        it('does not render an unsafe URL as an href', async () => {
            const rendered = await render([child('Danger', {url: 'javascript:alert(1)'})]);

            expect(rendered).not.toContain('javascript:');
            expect(rendered).not.toContain('href="javascript');
            expect(rendered).toContain('Danger');
        });
    });

    describe('edit mode', () => {
        it('emits no card field targets for generated children', async () => {
            const rendered = await render([child('One'), child('Two')], {intro: {title: 'Explore'}}, editor);

            // Generated children have no manual cards[] path to edit.
            expect(rendered).not.toContain('cards[');
            // Only the intro heading has an editor target; the list items do not.
            const listItems = rendered.split('<li').slice(1);
            expect(listItems).toHaveLength(2);
            for (const item of listItems) {
                expect(item).not.toContain('data-sq-field');
            }
        });

        it('keeps the intro title target in edit mode', async () => {
            const rendered = await render([child('One')], {intro: {title: 'Explore'}}, editor);

            expect(rendered).toContain('data-sq-field="intro.title"');
        });
    });

    describe('lookup inputs', () => {
        it('passes the display and description key to the child lookup', async () => {
            mockedChildren.mockResolvedValue([child('One')]);

            await CardListing.main(
                {
                    listing: {source: 'custom', rootNode: 'matrix-asset://id/7'},
                    settings: {
                        display: 'name-and-description',
                        descriptionMetadataFieldKey: 'page-lead',
                    },
                },
                undefined,
            );

            expect(mockedChildren).toHaveBeenCalledWith('7', undefined, {
                display: 'name-and-description',
                descriptionMetadataFieldKey: 'page-lead',
            });
        });
    });

    describe('preview data and manifest', () => {
        it('renders the preview as a list of child pages from the lookup', async () => {
            mockedChildren.mockResolvedValue([child('Get started', {url: '/get-started'}), child('Components', {url: '/components'})]);

            const rendered = await CardListing.main(previewData as CardListingInput);

            expect(rendered).toContain('Explore the design system');
            expect(rendered.match(/<li[\s>]/g)).toHaveLength(2);
        });

        it('uses only settings, intro and listing fields that the manifest declares', () => {
            const input = manifest.functions[0].input.properties;
            const declaredSettings = Object.keys(input.settings.properties);
            const declaredIntro = Object.keys(input.intro.properties);
            const declaredListing = Object.keys(input.listing.properties);

            for (const key of Object.keys(previewData.settings)) {
                expect(declaredSettings).toContain(key);
            }
            for (const key of Object.keys(previewData.intro)) {
                expect(declaredIntro).toContain(key);
            }
            for (const key of Object.keys(previewData.listing)) {
                expect(declaredListing).toContain(key);
            }
        });

        it('declares no click action, arrow toggle or manual cards', () => {
            const settings = manifest.functions[0].input.properties.settings.properties;
            const properties = manifest.functions[0].input.properties;

            expect(settings).not.toHaveProperty('action');
            expect(settings).not.toHaveProperty('isArrowVisible');
            expect(properties).not.toHaveProperty('cards');
        });

        it('declares the display options and the custom root field', () => {
            const settings = manifest.functions[0].input.properties.settings.properties;
            const listing = manifest.functions[0].input.properties.listing.properties;

            expect(settings.display.enum).toEqual(['name', 'name-and-description']);
            expect(listing.source.enum).toEqual(['current', 'custom']);
            expect(manifest.functions[0].input.properties.listing.allOf[0].then.properties.rootNode.format).toBe('matrix-asset-uri');
        });

        it('does not expose featured cards', () => {
            const declared = JSON.stringify(manifest);

            expect(declared).not.toContain('"feature"');
        });
    });
});
