import {describe, expect, it} from 'vitest';
import backToTop from './main.js';

const LINK_OPEN = '<a class="qld-dir-link';

describe('backToTop main', () => {
    it('renders the default link without an outer wrapper', async () => {
        const html = await backToTop.main({
            label: 'Back to top',
            href: '#',
            position: 'left',
        });

        expect(html).toContain('<div class="back-to-top d-print-none">');
        expect(html).toContain(`${LINK_OPEN} up" href="#"`);
        expect(html).toContain('Back to top');
        expect(html).not.toContain('class=""');
    });

    it('uses the left position by default and right adds ms-auto', async () => {
        const left = await backToTop.main({label: 'Top', href: '#'});
        const right = await backToTop.main({
            label: 'Top',
            href: '#',
            position: 'right',
        });

        expect(left).toContain(`${LINK_OPEN} up"`);
        expect(left).not.toContain('ms-auto');
        expect(right).toContain(`${LINK_OPEN} up ms-auto"`);
    });

    it('wraps the link in an outer div when wrapper classes are set', async () => {
        const html = await backToTop.main({
            label: 'Top',
            href: '#',
            wrapperClasses: 'bg-light py-3',
        });

        expect(html.startsWith('<div class="bg-light py-3">')).toBe(true);
        expect(html).toContain('<div class="back-to-top d-print-none">');
    });

    it('escapes wrapper classes so they cannot add attributes', async () => {
        const html = await backToTop.main({
            label: 'Top',
            href: '#',
            wrapperClasses: 'dark" onmouseover="alert(1)',
        });

        expect(html).toContain('dark&quot; onmouseover=&quot;alert(1)');
        expect(html).not.toContain('onmouseover="');
    });

    it('escapes the href so it cannot break out of the attribute', async () => {
        const html = await backToTop.main({
            label: 'Top',
            href: '/#" onmouseover="alert(1)',
        });

        expect(html).not.toContain('onmouseover="');
        expect(html).toContain('href="/#&quot; onmouseover=&quot;alert(1)"');
    });

    it('keeps ampersands in query strings as HTML entities', async () => {
        const html = await backToTop.main({
            label: 'Top',
            href: 'https://www.qld.gov.au/?a=1&b=2',
        });

        expect(html).toContain('href="https://www.qld.gov.au/?a=1&amp;b=2"');
    });

    it.each(['javascript:alert(1)', '  JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)'])(
        'falls back to # for the unsafe href %j',
        async (href) => {
            const html = await backToTop.main({label: 'Top', href});

            expect(html).toContain('href="#"');
            expect(html).not.toMatch(/javascript:|data:|vbscript:/i);
        },
    );

    it('uses the Handlebars defaults when the label and href are missing', async () => {
        const html = await backToTop.main({label: '  ', href: ''});

        expect(html).toContain('Back to top');
        expect(html).toContain('href="#"');
    });

    it('uses the defaults when called without input', async () => {
        const html = await backToTop.main();

        expect(html).toContain('Back to top');
        expect(html).toContain('href="#"');
        expect(html).toContain(`${LINK_OPEN} up"`);
    });

    it('strips script markup from the label', async () => {
        const html = await backToTop.main({
            label: '<img src=x onerror="alert(1)">Top',
            href: '#',
        });

        expect(html).not.toContain('onerror="');
        expect(html).toContain('Top');
    });

    it('marks the label as inline editable in editor mode only', async () => {
        const editor = await backToTop.main({label: 'Top', href: '#'}, {ctx: {editor: true}});
        const live = await backToTop.main({label: 'Top', href: '#'}, {ctx: {}});

        expect(editor).toContain('<span data-sq-field="label">Top</span>');
        expect(live).not.toContain('data-sq-field');
    });
});
