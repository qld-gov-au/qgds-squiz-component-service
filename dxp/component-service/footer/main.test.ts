import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import FooterComponent from './main.ts';
import defaultData from './example.data.json';
import type {FooterInput} from './types.ts';

const editorInfo = {ctx: {editor: true}};

// Shape of the dev render runtime's resolveMatrixAssetById mock: a name, and no URL.
const devMockInfo = {
    fns: {
        resolveMatrixAssetById: async (assetId: string) => ({
            id: assetId,
            type: 'page',
            name: 'Mock Asset',
            url: '',
            urls: [],
        }),
    },
};

const GOVERNMENT_LABELS = ['Copyright', 'Disclaimer', 'Privacy', 'Right to information', 'Accessibility', 'Jobs in Queensland Government', 'Other languages'];

describe('Footer main', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders a contentinfo footer with no modifier class for the default variant', async () => {
        const rendered = await FooterComponent.main(defaultData as FooterInput);

        expect(rendered).toContain('<footer class="qld-footer" role="contentinfo">');
    });

    it.each([
        ['dark', 'class="qld-footer dark"'],
        ['dark-alt', 'class="qld-footer dark-alt"'],
    ] as const)('adds the %s modifier class', async (variant, expected) => {
        const rendered = await FooterComponent.main({
            ...(defaultData as FooterInput),
            variant,
        });

        expect(rendered).toContain(expected);
    });

    it('renders the default blank footer from empty input', async () => {
        const rendered = await FooterComponent.main({});

        expect(rendered).toContain('class="qld-footer"');
        expect(rendered).toContain('Contact us');
        expect(rendered).toContain('href="tel:137468"');
        expect(rendered).toContain('qld-icon-phone');
        expect(rendered).toContain('qld-icon-email');
        expect(rendered).toContain('Acknowledgement of Country');
        expect(rendered).toContain('We pay our respects');
        expect(rendered).toContain('© The State of Queensland</span> 2026');
        expect(rendered).not.toContain('footer-site-name');
        expect(rendered).not.toContain('footer-crest');
        expect(rendered).not.toContain('optional-column');
    });

    it('does not render an empty government link when a picked asset resolves to nothing', async () => {
        const rendered = await FooterComponent.main({
            footerLinks: {list: [{matrixAssetId: '99'}]},
        });

        expect(rendered).not.toContain('<a class="nav-link" href="#"></a>');
        // No usable authored link, so the mandatory defaults show, as for an empty list.
        for (const label of GOVERNMENT_LABELS) {
            expect(rendered).toContain(label);
        }
    });

    it('does not render an empty custom link or an empty optional column', async () => {
        const rendered = await FooterComponent.main({
            optionalColumn1: {
                title: 'Partners',
                customLinks: [{matrixAssetId: '99'}],
            },
        });

        expect(rendered).not.toContain('<a class="nav-link" href="#"></a>');
        expect(rendered).not.toContain('optional-column-1');
        expect(rendered).not.toContain('Partners');
    });

    it('drops a government link whose asset has a name but no URL', async () => {
        const rendered = await FooterComponent.main({footerLinks: {list: [{matrixAssetId: '99'}]}}, devMockInfo);

        expect(rendered).not.toContain('Mock Asset');
        expect(rendered).not.toContain('<a class="nav-link" href="#"></a>');
        for (const label of GOVERNMENT_LABELS) {
            expect(rendered).toContain(label);
        }
    });

    it('keeps the default contact URL when the contact asset has no URL', async () => {
        const rendered = await FooterComponent.main({contact: {button: {matrixAssetId: '10'}}}, devMockInfo);

        expect(rendered).toContain('<a href="https://www.qld.gov.au/contact-us" class="btn btn-outline-secondary">Mock Asset</a>');
    });

    it('drops a social link whose asset has no URL', async () => {
        const rendered = await FooterComponent.main(
            {
                optionalColumn2: {
                    title: 'Follow us',
                    followLinks: [
                        {
                            icon: 'facebook',
                            accessibleLabel: 'Facebook',
                            link: {matrixAssetId: '99'},
                        },
                    ],
                },
            },
            devMockInfo,
        );

        expect(rendered).not.toContain('footer-link-list--social');
        expect(rendered).not.toContain('Mock Asset');
        expect(rendered).not.toContain('href="#"');
        expect(rendered).not.toContain('optional-column-2');
    });

    it('renders the mandatory government links in order when the author list is empty', async () => {
        const rendered = await FooterComponent.main({});

        let previousIndex = -1;
        for (const label of GOVERNMENT_LABELS) {
            const index = rendered.indexOf(`>${label}</a>`);
            expect(index, label).toBeGreaterThan(previousIndex);
            previousIndex = index;
        }
    });

    it('labels the government links as a navigation landmark', async () => {
        const rendered = await FooterComponent.main(defaultData as FooterInput);

        expect(rendered).toMatch(/<nav class="col-12 col-lg-2 border-column" aria-label="Footer navigation">/);
        expect(rendered).not.toContain('aria-label="footer-navigation"');
    });

    it('omits Help and does not link Crown copyright in the default government links', async () => {
        const rendered = await FooterComponent.main({});

        expect(rendered).not.toContain('>Help</a>');
        expect(rendered).not.toContain('>Crown copyright</a>');
    });

    it('uses fixed dividers on government links and optional columns, but not on contact', async () => {
        const rendered = await FooterComponent.main({
            optionalColumn1: {title: 'Partners', customLinks: [{text: 'Partner', url: 'https://partner.example'}]},
        });

        expect(rendered).toMatch(/<div class="col-12 col-lg-2 optional-column-1 border-column">/);
        expect(rendered).toMatch(/<nav aria-label="Partners">/);
        expect(rendered).toMatch(/<nav class="col-12 col-lg-2 border-column" aria-label="Footer navigation">/);
        expect(rendered).toMatch(/<div class="col-12 col-lg-3 py-24 py-lg-0 footer-contact">/);
    });

    it('wraps only the link lists of an optional column in a labelled nav', async () => {
        const rendered = await FooterComponent.main({
            optionalColumn1: {
                title: 'Partners',
                content: '<p>Some text</p>',
                customLinks: [{text: 'Partner', url: 'https://partner.example'}],
            },
        });

        expect(rendered).toMatch(/<div class="col-12 col-lg-2 optional-column-1 border-column">/);
        expect(rendered).not.toMatch(/<nav class="col-12 col-lg-2 optional-column-1/);

        const navStart = rendered.indexOf('<nav aria-label="Partners">');
        const navEnd = rendered.indexOf('</nav>', navStart);
        expect(navStart).toBeGreaterThan(-1);
        const navInner = rendered.slice(navStart, navEnd);
        expect(navInner).toContain('href="https://partner.example"');
        expect(navInner).not.toContain('Some text');
        expect(rendered).toContain('<p>Some text</p>');
    });

    it('does not render a nav for an optional column with text but no links', async () => {
        const rendered = await FooterComponent.main({
            optionalColumn1: {title: 'Intro', content: '<p>Text only</p>'},
        });

        expect(rendered).toContain('optional-column-1');
        expect(rendered).toContain('Text only');
        expect(rendered).not.toContain('<nav aria-label="Intro">');
    });

    it("uses the author's government links when the list is set", async () => {
        const rendered = await FooterComponent.main({
            footerLinks: {
                list: [{text: 'Custom link', url: 'https://example.com/custom'}],
            },
        });

        expect(rendered).toContain('<a class="nav-link" href="https://example.com/custom">Custom link</a>');
        expect(rendered).toContain('pt-lg-2');
        expect(rendered).not.toContain('>Help</a>');
        expect(rendered).not.toContain('>Copyright</a>');
    });

    it('renders the site name only when it is set', async () => {
        const withName = await FooterComponent.main({sitename: 'My agency'});
        const withoutName = await FooterComponent.main({});

        expect(withName).toContain('<h2 class="footer-site-name">My agency</h2>');
        expect(withoutName).not.toContain('footer-site-name');
    });

    it('hides contact details when showList is false', async () => {
        const rendered = await FooterComponent.main({
            contact: {showList: false},
        });

        expect(rendered).not.toContain('footer-contact-item');
        expect(rendered).toContain('footer-contact');
    });

    it('uses the contact button SquizLink for label and href', async () => {
        const rendered = await FooterComponent.main({
            contact: {
                button: {text: 'Get help', url: 'https://example.com/help'},
            },
        });

        expect(rendered).toContain('<a href="https://example.com/help" class="btn btn-outline-secondary">Get help</a>');
    });

    it('hides optional column 1 and shows optional column 2 for the default preview', async () => {
        const rendered = await FooterComponent.main(defaultData as FooterInput);

        expect(rendered).not.toContain('optional-column-1');
        expect(rendered).toContain('optional-column-2');
        expect(rendered).toContain('Follow us');
        expect(rendered).toContain('footer-link-list--social');
    });

    it('renders social icons with screen reader labels', async () => {
        const rendered = await FooterComponent.main(defaultData as FooterInput);

        expect(rendered).toContain('qld-icon-facebook');
        expect(rendered).toContain('<span class="sr-only">Facebook page</span>');
        // Falls back to the link text when no accessible label is set.
        expect(rendered).toContain('<span class="sr-only">Youtube</span>');
    });

    it('renders social links only in the column that holds them', async () => {
        const rendered = await FooterComponent.main({
            optionalColumn1: {
                title: 'Follow us',
                followLinks: [{icon: 'x', link: {text: 'X', url: 'https://x.example'}}],
            },
            optionalColumn2: {title: 'Other', content: '<p>Text only</p>'},
        });

        const column1 = rendered.split('optional-column-2')[0];
        const column2 = rendered.split('optional-column-2')[1];
        expect(column1).toContain('footer-link-list--social');
        expect(column2).not.toContain('footer-link-list--social');
    });

    it('renders custom links from the column that holds them', async () => {
        const enabled = await FooterComponent.main({
            optionalColumn1: {
                title: 'Partners',
                customLinks: [{text: 'Partner', url: 'https://partner.example'}],
            },
        });
        const withoutLinks = await FooterComponent.main({
            optionalColumn1: {title: 'Partners'},
        });

        expect(enabled).toContain('footer-link-list--custom');
        expect(enabled).toContain('<a class="nav-link" href="https://partner.example">Partner</a>');
        expect(withoutLinks).not.toContain('footer-link-list--custom');
    });

    it('does not render an optional column with no content or links', async () => {
        const rendered = await FooterComponent.main({
            optionalColumn1: {title: 'Empty column'},
        });

        expect(rendered).not.toContain('optional-column-1');
        expect(rendered).not.toContain('Empty column');
    });

    it('sanitises author HTML and escapes link attributes', async () => {
        const rendered = await FooterComponent.main({
            copyright: {
                content: '<img src=x onerror="alert(1)">Test copyright',
            },
            optionalColumn1: {
                title: 'Partners',
                customLinks: [
                    {
                        text: '<script>alert(1)</script>Unsafe',
                        url: 'javascript:alert(1)',
                    },
                    {
                        text: 'Quoted',
                        url: 'https://example.com/?a="b"',
                    },
                ],
            },
        });

        expect(rendered).not.toContain('onerror');
        expect(rendered).not.toContain('<script>');
        expect(rendered).not.toContain('javascript:');
        // The unsafe link is dropped, not rendered with a placeholder href.
        expect(rendered).not.toContain('Unsafe');
        expect(rendered).toContain('Quoted');
        expect(rendered).toContain('https://example.com/?a=&quot;b&quot;');
    });

    it('keeps entities in copyright text', async () => {
        const rendered = await FooterComponent.main(defaultData as FooterInput);

        expect(rendered).toContain('&copy; The State of Queensland (Organisation)');
    });

    it('adds the start year before the current year when it is set', async () => {
        const rendered = await FooterComponent.main({
            copyright: {yearFrom: '1995'},
        });

        // ForGov checkpoint 34: en dash, no spaces.
        expect(rendered).toContain('1995–2026');
        expect(rendered).not.toContain('1995 - 2026');
    });

    it('shows the current year only when the start year is empty', async () => {
        const rendered = await FooterComponent.main({
            copyright: {yearFrom: ''},
        });

        expect(rendered).toContain('© The State of Queensland</span> 2026');
        expect(rendered).not.toContain('–2026');
    });

    it('renders the Coat of Arms when show is true and nothing when false', async () => {
        const crest = await FooterComponent.main({footerLogo: {show: true}});
        const hidden = await FooterComponent.main({footerLogo: {show: false}});

        expect(crest).toContain('<div class="footer-crest">');
        expect(crest).toContain('<svg');
        expect(hidden).not.toContain('footer-crest');
    });

    it('always renders the Queensland Government organisation link', async () => {
        const rendered = await FooterComponent.main({});

        expect(rendered).toContain('<a class="fw-semibold" href="https://www.qld.gov.au" rel="external">Queensland Government</a>');
    });

    it('keeps the fixed acknowledgement heading and replaces the paragraph with authored content', async () => {
        const rendered = await FooterComponent.main({
            acknowledgement: '<p>Hello</p>',
        });

        expect(rendered).toContain('<h3 class="footer-heading">Acknowledgement of Country</h3><p>Hello</p>');
        expect(rendered).not.toContain('We pay our respects');
    });

    it('adds data-sq-field only in editor mode', async () => {
        const data = defaultData as FooterInput;

        const editing = await FooterComponent.main(data, editorInfo);
        const viewing = await FooterComponent.main(data);

        expect(editing).toContain('data-sq-field="sitename"');
        expect(editing).toContain('data-sq-field="contact.content"');
        expect(editing).toContain('data-sq-field="contact.button"');
        expect(editing).toContain('data-sq-field="copyright.content"');
        expect(editing).not.toContain('data-sq-field="organisationLink');
        expect(viewing).not.toContain('data-sq-field');
    });
});
