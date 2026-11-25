import LinkComponent from './main.js';
import mockData from './example.data.json';

describe('Link', () => {
    it('renders the default example data', async () => {
        const rendered = await LinkComponent.main(mockData);

        expect(rendered).toContain('class="dark"');
        expect(rendered).toContain('Document title (PDF 2.5 MB)');
        expect(rendered).toContain('qld-icon-document-pdf');
    });

    it('returns an empty string when links is missing or empty', async () => {
        expect(await LinkComponent.main({})).toBe('');
        expect(await LinkComponent.main({links: []})).toBe('');
        expect(await LinkComponent.main(undefined)).toBe('');
    });

    it('renders a single link as one anchor (no list)', async () => {
        const rendered = await LinkComponent.main({links: [{link: {text: 'Click here', url: 'https://example.com'}}]});

        expect(rendered).toContain('class="link"');
        expect(rendered).toContain('href="https://example.com"');
        expect(rendered).toContain('Click here');
        expect(rendered).not.toContain('link-list');
        expect(rendered).not.toContain('link-item');
    });

    it('renders multiple links as ul with li items', async () => {
        const rendered = await LinkComponent.main({
            links: [{link: {text: 'First', url: '#1'}}, {link: {text: 'Second', url: '#2'}}],
        });

        expect(rendered).toContain('class="link-list"');
        expect(rendered.match(/class="link-item"/g)).toHaveLength(2);
    });

    it('wraps output in div.dark when variant is "dark"', async () => {
        const rendered = await LinkComponent.main({variant: 'dark', links: [{link: {text: 'Link', url: '#'}}]});

        expect(rendered).toMatch(/<div class="dark">\s*<a class="link"/);
    });

    it('respects icon position', async () => {
        const rendered = await LinkComponent.main({
            links: [{link: {text: 'PDF', url: '#'}, iconClass: 'qld-icon-document-pdf', iconPosition: 'trailing'}],
        });

        expect(rendered).toContain('qld-icon qld-icon-md qld-icon-document-pdf trailing');
    });

    it('renders id, aria-label and download when provided', async () => {
        const rendered = await LinkComponent.main({
            links: [{link: {text: 'Download', url: '/file.pdf'}, id: 'my-link', ariaLabel: 'Download the file', download: 'document.pdf'}],
        });

        expect(rendered).toContain('id="my-link"');
        expect(rendered).toContain('aria-label="Download the file"');
        expect(rendered).toContain('download="document.pdf"');
    });

    it('escapes XSS in text, href and wrapper classes', async () => {
        const rendered = await LinkComponent.main({
            wrapperClasses: '" onclick="x',
            links: [{link: {text: '<script>alert(1)</script>', url: '" onclick="y'}}],
        });

        expect(rendered).not.toContain('<script>');
        expect(rendered).not.toContain('" onclick=');
    });
});
