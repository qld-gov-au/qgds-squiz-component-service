import {describe, expect, it, vi} from 'vitest';
import CardComponent from './main.js';
import mockData from './example.no-action.data.json';

/**
 * Tests for the Card component (Advanced).
 *
 * Covers attribute escaping and unsafe URLs in the shared Card helpers,
 * SquizLink resolution through `info.fns` (mocked, no Matrix calls),
 * empty output in live mode, and edit-mode targets.
 */

const settings = {
    variant: 'default',
    action: 'single',
    isArrowVisible: false,
    isEqualHeight: false,
    wrapperClasses: 'row',
};

const render = (cards, componentUtilities) => CardComponent.main({settings, cards}, componentUtilities);

const editor = {ctx: {editor: true}};

describe('Card', () => {
    describe('empty output', () => {
        it('returns empty output without cards', async () => {
            expect(await CardComponent.main({settings, cards: []})).toBe('');
            expect(await CardComponent.main({})).toBe('');
            expect(await CardComponent.main(undefined)).toBe('');
        });
    });

    describe('preview data', () => {
        it('renders one card per preview card', async () => {
            const rendered = await CardComponent.main(mockData);
            const titles = rendered.match(/class="card-title"/g) || [];
            expect(titles).toHaveLength(mockData.cards.length);
        });
    });

    describe('attribute escaping', () => {
        it('escapes wrapperClasses that try to close the class attribute', async () => {
            const rendered = await CardComponent.main({
                settings: {...settings, wrapperClasses: 'row" onclick="alert(1)'},
                cards: [{heading: {title: 'T'}}],
            });
            expect(rendered).toContain('<div class="row&quot; onclick=&quot;alert(1)">');
            expect(rendered).not.toContain('onclick="');
        });

        it('escapes a heading link URL that tries to close the href attribute', async () => {
            const rendered = await render([{heading: {title: 'T', link: {url: 'x" onmouseover="alert(1)'}}}]);
            expect(rendered).toContain('href="x&quot; onmouseover=&quot;alert(1)"');
            expect(rendered).not.toContain('onmouseover="');
        });

        it('keeps a safe heading link with its class and target', async () => {
            const rendered = await render([{heading: {title: 'T', link: {url: '/page', target: '_blank'}}}]);
            expect(rendered).toContain('href="/page"');
            expect(rendered).toContain('class="stretched-link"');
            expect(rendered).toContain('target="_blank"');
        });

        it('drops a target that is not a plain window name', async () => {
            const rendered = await render([
                {
                    heading: {
                        title: 'T',
                        link: {url: '/page', target: '_blank onclick=alert(1)'},
                    },
                },
            ]);
            expect(rendered).toContain('href="/page"');
            expect(rendered).not.toContain('onclick=');
        });

        it('renders the heading as plain text when the link URL is javascript:', async () => {
            const rendered = await render([{heading: {title: 'Card title', link: {url: 'javascript:alert(1)'}}}]);
            expect(rendered).toContain('Card title');
            expect(rendered).not.toMatch(/<a\s/);
            expect(rendered).not.toContain('javascript:');
        });

        it('drops javascript: URLs written with control characters', async () => {
            const rendered = await render([{heading: {title: 'Card title', link: {url: 'java\tscript:alert(1)'}}}]);
            expect(rendered).not.toMatch(/<a\s/);
        });

        it('falls back to h3 for a heading tag outside the manifest list', async () => {
            const rendered = await render([{heading: {title: 'T', headingTag: 'script'}}]);
            expect(rendered).toContain('<h3');
            expect(rendered).not.toContain('<script');
        });

        it('escapes image alt text and exposes it as an image role', async () => {
            const rendered = await render([
                {
                    image: {
                        enabled: true,
                        source: 'External',
                        external: {url: '/i.jpg', alt: '" onerror="alert(1)'},
                    },
                },
            ]);
            expect(rendered).toContain('role="img"');
            expect(rendered).toContain('aria-label="&quot; onerror=&quot;alert(1)"');
            expect(rendered).not.toContain('onerror="');
        });

        it('keeps a CSS image URL inside its quoted string', async () => {
            const rendered = await render([
                {
                    image: {
                        enabled: true,
                        source: 'External',
                        external: {url: '/a.jpg"); background: red'},
                    },
                },
            ]);
            expect(rendered).toContain('--card-image:url(&quot;/a.jpg');
            expect(rendered).not.toContain('"); background');
        });

        it('escapes footer CTA text so it cannot add HTML', async () => {
            const rendered = await render([
                {
                    footer: {
                        enabled: true,
                        cta: {url: '/c', text: '<img src=x onerror=alert(1)>'},
                    },
                },
            ]);
            expect(rendered).toContain('href="/c"');
            expect(rendered).toContain('&lt;img src=x onerror=alert(1)&gt;');
            expect(rendered).not.toContain('<img');
            expect(rendered).not.toContain('onerror="');
        });

        it('drops a footer CTA whose URL is javascript:', async () => {
            const rendered = await render([
                {
                    footer: {
                        enabled: true,
                        cta: {url: 'javascript:alert(1)', text: 'Go'},
                    },
                },
            ]);
            expect(rendered).not.toContain('qld-cta-link');
            expect(rendered).not.toContain('card-footer');
        });

        it('drops footer links with unsafe URLs and keeps safe ones', async () => {
            const rendered = await render([
                {
                    footer: {
                        enabled: true,
                        links: {
                            variant: 'default',
                            items: [{link: {url: 'javascript:alert(1)', text: 'Bad'}}, {link: {url: '/ok', text: 'Good'}}],
                        },
                    },
                },
            ]);
            expect(rendered).toContain('href="/ok"');
            expect(rendered).not.toContain('Bad');
            expect(rendered).not.toContain('javascript:');
        });

        it('escapes footer tag link text', async () => {
            const rendered = await render([
                {
                    footer: {
                        enabled: true,
                        links: {
                            variant: 'tags',
                            items: [{link: {url: '/t', text: '<b>x</b>'}}],
                        },
                    },
                },
            ]);
            expect(rendered).toContain('href="/t"');
            expect(rendered).not.toContain('<b>');
        });
    });

    describe('SquizLink resolution', () => {
        it('resolves a heading Matrix asset link through info.fns', async () => {
            const resolveMatrixAssetById = vi.fn().mockResolvedValue({
                url: '/resolved',
                name: 'Resolved page',
            });

            const rendered = await render([{heading: {title: 'Card title', link: {matrixAssetId: '42'}}}], {fns: {resolveMatrixAssetById}});

            expect(resolveMatrixAssetById).toHaveBeenCalledWith('42');
            expect(rendered).toContain('href="/resolved"');
        });

        it('resolves a footer CTA Matrix asset through info.fns', async () => {
            const resolveMatrixAssetById = vi.fn().mockResolvedValue({
                url: '/resolved',
                name: 'Resolved page',
            });

            const rendered = await render([{footer: {enabled: true, cta: {matrixAssetId: '7'}}}], {fns: {resolveMatrixAssetById}});

            expect(resolveMatrixAssetById).toHaveBeenCalledWith('7');
            expect(rendered).toContain('href="/resolved"');
            expect(rendered).toContain('Resolved page');
        });

        it('renders no link for a Matrix asset when no resolver is supplied', async () => {
            const rendered = await render([{heading: {title: 'Card title', link: {matrixAssetId: '42'}}}]);
            expect(rendered).not.toMatch(/<a\s/);
            expect(rendered).toContain('Card title');
        });
    });

    describe('edit mode', () => {
        const emptyCard = {
            heading: {title: 'Card title'},
            body: {},
            image: {enabled: true, source: 'Matrix', matrix: {}},
            footer: {enabled: true},
            video: {enabled: true},
        };

        it('keeps edit targets for empty fields', async () => {
            const rendered = await render([emptyCard], editor);
            expect(rendered).toContain('data-sq-field="cards[0].heading.title"');
            expect(rendered).toContain('data-sq-field="cards[0].body.date"');
            expect(rendered).toContain('data-sq-field="cards[0].body.content"');
            expect(rendered).toContain('data-sq-field="cards[0].image.matrix"');
            expect(rendered).toContain('data-sq-field="cards[0].footer.content"');
            expect(rendered).toContain('data-sq-field="cards[0].video.duration"');
        });

        it('marks a heading link for editing once it resolves', async () => {
            const resolveMatrixAssetById = vi.fn().mockResolvedValue({url: '/resolved', name: 'Resolved page'});
            const rendered = await render([{heading: {title: 'Card title', link: {matrixAssetId: '42'}}}], {ctx: {editor: true}, fns: {resolveMatrixAssetById}});
            expect(rendered).toContain('data-sq-field="cards[0].heading.link"');
        });
    });

    describe('live mode', () => {
        it('omits empty footer, image, date, content and video', async () => {
            const rendered = await render([
                {
                    heading: {title: 'Card title'},
                    body: {},
                    image: {enabled: true, source: 'Matrix', matrix: {}},
                    footer: {enabled: true},
                    video: {enabled: true},
                },
            ]);
            expect(rendered).not.toContain('card-footer');
            expect(rendered).not.toContain('card-img');
            expect(rendered).not.toContain('card-date');
            expect(rendered).not.toContain('card-text');
            expect(rendered).not.toContain('video-overlay');
        });
    });
});
