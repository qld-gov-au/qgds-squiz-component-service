import {afterEach, describe, expect, it, vi} from 'vitest';
import BannerComponent from './main.js';
import mockData from './example.data.json';
import lineageFixture from '../../utils/matrix/siteLineage/fixtures/site-lineage-page-content.json';
import previewBreadcrumbs from '../../utils/matrix/siteLineage/fixtures/preview-breadcrumbs.json';

/**
 * Tests for the Banner component.
 *
 * Covers escaping of attributes and text, unsafe URLs, empty output, edit-mode
 * targets, CTA handling, SquizLink resolution through `info.fns` (stubbed),
 * and breadcrumbs from the site lineage (stubbed fetch). No live Matrix calls.
 */

const editor = {ctx: {editor: true}};

const baseInput = {
    textContent: {title: 'Heading'},
    backgroundType: 'none',
    callToAction: 'none',
};

const render = (input, componentUtilities) => BannerComponent.main({...baseInput, ...input}, componentUtilities);

/** A placed page: the current asset is in the lineage fixture, with the Matrix env it needs. */
const placedInfo = () => ({
    ctx: {
        assetId: '472',
        url: 'https://staging-web.matrix.squiz.cloud/arts-rebuild-2026/whats-on/content-page',
    },
    env: {
        MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
        BEARER_AUTH: 'token',
    },
});

/** Stub the site lineage fetch. Returns the mock so tests can check for calls. */
const stubLineage = (payload) => {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => payload,
    }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

/** A fresh copy of the lineage fixture with changes applied by the test. */
const lineageWith = (change) => {
    const payload = structuredClone(lineageFixture);
    change(payload);
    return payload;
};

const assetById = (payload, id) => payload.assets.find((asset) => String(asset.id) === id);

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('Banner', () => {
    describe('preview data', () => {
        it('renders the title, abstract and CTA from the preview data', async () => {
            const rendered = await BannerComponent.main(mockData);
            expect(rendered).toContain('Heading 1');
            expect(rendered).toContain('Renew your licence');
            expect(rendered).toContain('href="https://www.google.com"');
            expect(rendered).toContain('Link 1');
        });
    });

    describe('empty output', () => {
        it('returns empty output in live mode when the title is missing', async () => {
            expect(await BannerComponent.main({textContent: {title: ''}})).toBe('');
            expect(await BannerComponent.main({})).toBe('');
            expect(await BannerComponent.main(undefined)).toBe('');
        });

        it('keeps the title markup in edit mode when the title is empty', async () => {
            const rendered = await BannerComponent.main({textContent: {title: ''}}, editor);
            expect(rendered).toContain('data-sq-field="textContent.title"');
        });
    });

    describe('edit mode', () => {
        it('omits data-sq-field attributes in live output', async () => {
            const rendered = await BannerComponent.main(mockData);
            expect(rendered).not.toContain('data-sq-field');
        });

        it('renders edit targets for empty subtitle and abstract', async () => {
            const rendered = await render({textContent: {title: 'T', subtitle: '', abstract: ''}}, editor);
            expect(rendered).toContain('data-sq-field="textContent.subtitle"');
            expect(rendered).toContain('data-sq-field="textContent.abstract"');
        });

        it('omits empty subtitle and abstract in live output', async () => {
            const rendered = await render({
                textContent: {title: 'T', subtitle: '', abstract: ''},
            });
            expect(rendered).not.toContain('banner-subtitle');
            expect(rendered).not.toContain('banner-abstract');
        });

        it('renders CTA edit targets using the manifest index', async () => {
            const rendered = await render(
                {
                    callToAction: 'buttons',
                    ctaItems: [
                        {
                            link: {text: 'A', url: 'https://a.example'},
                            variantClass: 'btn-primary',
                        },
                    ],
                },
                editor,
            );
            expect(rendered).toContain('data-sq-field="ctaItems[0].link.url"');
            expect(rendered).toContain('data-sq-field="ctaItems[0].link.text"');
        });
    });

    describe('CTA items', () => {
        it('does not throw for buttons without ctaItems and renders no CTA group', async () => {
            const rendered = await render({callToAction: 'buttons'});
            expect(rendered).toContain('banner-title');
            expect(rendered).not.toContain('banner-cta');
        });

        it('escapes a CTA href that tries to close the attribute', async () => {
            const rendered = await render({
                callToAction: 'buttons',
                ctaItems: [
                    {
                        link: {text: 'A', url: 'x" onmouseover="alert(1)'},
                        variantClass: 'btn-primary',
                    },
                ],
            });
            expect(rendered).toContain('href="x&quot; onmouseover=&quot;alert(1)"');
            expect(rendered).not.toContain('onmouseover="');
        });

        it('escapes a CTA label that tries to close the aria-label attribute', async () => {
            const rendered = await render({
                callToAction: 'buttons',
                ctaItems: [
                    {
                        link: {text: 'Go" onclick="alert(1)', url: 'https://a.example'},
                        variantClass: 'btn-primary',
                    },
                ],
            });
            expect(rendered).toContain('aria-label="Go&quot; onclick=&quot;alert(1)"');
        });

        it('drops CTA items with an unsafe URL in live mode', async () => {
            const rendered = await render({
                callToAction: 'buttons',
                ctaItems: [
                    {
                        link: {text: 'Bad', url: 'javascript:alert(1)'},
                        variantClass: 'btn-primary',
                    },
                ],
            });
            expect(rendered).not.toContain('javascript:');
            expect(rendered).not.toContain('banner-cta');
        });

        it('drops CTA items with no URL in live mode', async () => {
            const rendered = await render({
                callToAction: 'buttons',
                ctaItems: [{link: {text: 'No URL'}, variantClass: 'btn-primary'}],
            });
            expect(rendered).not.toContain('No URL');
            expect(rendered).not.toContain('href="#"');
        });

        it('keeps CTA items with no URL in edit mode with a placeholder href', async () => {
            const rendered = await render(
                {
                    callToAction: 'buttons',
                    ctaItems: [{link: {text: 'No URL'}, variantClass: 'btn-primary'}],
                },
                editor,
            );
            expect(rendered).toContain('No URL');
            expect(rendered).toContain('href="#"');
        });

        it('resolves Matrix asset picker links through info.fns', async () => {
            const resolveMatrixAssetById = vi.fn(async () => ({
                url: '/resolved-page',
                name: 'Resolved page',
            }));
            const rendered = await render(
                {
                    callToAction: 'buttons',
                    ctaItems: [{link: {matrixAssetId: '123'}, variantClass: 'btn-primary'}],
                },
                {fns: {resolveMatrixAssetById}},
            );
            expect(resolveMatrixAssetById).toHaveBeenCalledWith('123');
            expect(rendered).toContain('href="/resolved-page"');
            expect(rendered).toContain('Resolved page');
        });

        it('keeps the manifest index for mixed card colours after an earlier item is dropped', async () => {
            const rendered = await render({
                callToAction: 'cards-mixed',
                ctaItems: [{link: {text: 'Dropped', url: 'javascript:alert(1)'}}, {link: {text: 'Second', url: '/second'}}, {link: {text: 'Third', url: '/third'}}],
            });
            const second = rendered.indexOf('Second');
            const third = rendered.indexOf('Third');
            expect(rendered.slice(0, second)).toContain('card-dark dark');
            expect(rendered.slice(second, third)).toContain('card-dark-alt dark-alt');
        });

        it('renders card CTAs with the arrow icon hidden from assistive technology', async () => {
            const rendered = await render({
                callToAction: 'cards',
                ctaItems: [{link: {text: 'Card', url: '/card'}}],
            });
            expect(rendered).toContain('card-arrow');
            expect(rendered).toContain('aria-hidden="true"');
        });
    });

    describe('attribute escaping', () => {
        it('escapes wrapperClasses that try to close the class attribute', async () => {
            const rendered = await render({
                generalSettings: {wrapperClasses: 'x" onclick="alert(1)'},
            });
            expect(rendered).toContain('x&quot; onclick=&quot;alert(1)');
            expect(rendered).not.toContain('onclick="');
        });

        it('escapes the title so markup stays as text', async () => {
            const rendered = await render({
                textContent: {title: '<script>alert(1)</script>'},
            });
            expect(rendered).not.toContain('<script>');
        });
    });

    describe('breadcrumbs', () => {
        const breadcrumbSettings = {generalSettings: {showBreadcrumbs: true}};

        it('renders the site lineage trail with the current page as text', async () => {
            stubLineage(lineageFixture);

            const rendered = await render(breadcrumbSettings, placedInfo());

            expect(rendered).toContain('<nav aria-label="breadcrumb">');
            expect(rendered).toContain('<a href="/">Home</a>');
            expect(rendered).toContain('<a href="/whats-on">What&#39;s on</a>');
            expect(rendered).toContain('<li class="breadcrumb-item active" aria-current="page">');
            expect(rendered).toContain('Content page');
            expect(rendered).not.toContain('href="/whats-on/content-page"');
        });

        it('escapes breadcrumb titles and blocks attribute-breaking URLs', async () => {
            stubLineage(
                lineageWith((payload) => {
                    const whatsOn = assetById(payload, '470');
                    whatsOn.name = '<img src=x onerror=alert(1)>';
                    whatsOn.url = '/whats-on" onmouseover="alert(2)';
                }),
            );

            const rendered = await render(breadcrumbSettings, placedInfo());

            expect(rendered).not.toContain('<img');
            expect(rendered).toContain('&lt;img');
            expect(rendered).not.toContain('onmouseover="');
        });

        it('never writes a script URL into a breadcrumb href', async () => {
            stubLineage(
                lineageWith((payload) => {
                    assetById(payload, '470').url = 'javascript:alert(3)';
                }),
            );

            const rendered = await render(breadcrumbSettings, placedInfo());

            expect(rendered).not.toMatch(/href="\s*javascript:/i);
            expect(rendered).toContain('What&#39;s on');
        });

        it('renders no breadcrumb wrapper when the lineage has no trail', async () => {
            stubLineage({assets: [], links: []});

            const rendered = await render(breadcrumbSettings, placedInfo());

            expect(rendered).not.toContain('banner-breadcrumbs');
            expect(rendered).toContain('Heading');
        });

        it('renders no breadcrumb wrapper and does not throw when the lineage request fails', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => ({ok: false, status: 500})),
            );
            vi.spyOn(console, 'error').mockImplementation(() => {});

            const rendered = await render(breadcrumbSettings, placedInfo());

            expect(rendered).not.toContain('banner-breadcrumbs');
            expect(rendered).toContain('Heading');
        });

        it('shows no trail on a live page with no placement and makes no lookup', async () => {
            vi.stubEnv('IS_LOCAL', '');
            const fetchMock = stubLineage(lineageFixture);

            const rendered = await render(breadcrumbSettings, {ctx: {}});

            expect(rendered).not.toContain('banner-breadcrumbs');
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('shows the preview trail in the editor without a placement', async () => {
            vi.stubEnv('IS_LOCAL', '');
            const fetchMock = stubLineage(lineageFixture);

            const rendered = await render(breadcrumbSettings, {
                ctx: {editor: true},
            });

            for (const item of previewBreadcrumbs) {
                expect(rendered).toContain(item.title);
            }
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('shows the preview trail in local dev (IS_LOCAL) without a placement', async () => {
            vi.stubEnv('IS_LOCAL', 'true');
            const fetchMock = stubLineage(lineageFixture);

            const rendered = await render(breadcrumbSettings, {ctx: {}});

            for (const item of previewBreadcrumbs) {
                expect(rendered).toContain(item.title);
            }
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe('hero image', () => {
        const withImage = (squizImageField) => ({
            ...baseInput,
            backgroundType: 'with-hero-image',
            bannerImageField: {squizImageField},
        });

        it('renders the SquizImage url and alt text', async () => {
            const rendered = await BannerComponent.main(
                withImage({
                    alt: 'A hero',
                    imageVariations: {
                        original: {url: 'https://img.example/hero.jpg'},
                    },
                }),
            );
            expect(rendered).toContain('https://img.example/hero.jpg');
            expect(rendered).toContain('aria-label="A hero"');
            expect(rendered).toContain('role="img"');
        });

        it('escapes an image URL that tries to break out of the style attribute', async () => {
            const rendered = await BannerComponent.main(
                withImage({
                    alt: 'A hero',
                    imageVariations: {
                        original: {url: 'a.jpg"onerror="alert(1)'},
                    },
                }),
            );
            expect(rendered).not.toContain('onerror="');
        });

        it('escapes alt text that tries to close the aria-label attribute', async () => {
            const rendered = await BannerComponent.main(
                withImage({
                    alt: 'x" onclick="alert(1)',
                    imageVariations: {original: {url: 'https://img.example/a.jpg'}},
                }),
            );
            expect(rendered).not.toContain('onclick="');
        });

        it('omits the image in live mode when there is no usable image URL', async () => {
            const rendered = await BannerComponent.main(
                withImage({
                    alt: 'A hero',
                    imageVariations: {original: {url: 'javascript:alert(1)'}},
                }),
            );
            expect(rendered).not.toContain('banner-image-inner');
        });

        it('renders the image placeholder in edit mode without an image URL', async () => {
            const rendered = await BannerComponent.main(withImage({}), editor);
            expect(rendered).toContain('banner-image-inner');
            expect(rendered).toContain('data-sq-field="bannerImageField.squizImageField"');
        });
    });
});
