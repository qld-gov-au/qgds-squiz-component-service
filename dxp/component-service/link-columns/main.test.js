import LinkColumns from './main.js';
import mockData from './example.data.json';

const parse = (html) => new DOMParser().parseFromString(`<!DOCTYPE html><body>${html}</body>`, 'text/html');

describe('LinkColumns', () => {
    it('renders the default example data', async () => {
        const doc = parse(await LinkColumns.main(mockData));

        expect(doc.querySelector('section.link-column')).toBeTruthy();
        expect(doc.querySelector('ul.nav.col-vert-3')).toBeTruthy();
        expect(doc.querySelectorAll('li.nav-item:not(.all-link)').length).toBe(5);
        expect(doc.querySelector('li.all-link a.qld-cta-link.view-all')?.getAttribute('target')).toBe('_blank');
    });

    it('returns an empty string when links are missing or empty', async () => {
        expect(await LinkColumns.main({})).toBe('');
        expect(await LinkColumns.main({links: []})).toBe('');
        expect(await LinkColumns.main()).toBe('');
    });

    it('renders id, theme and horizontal flow', async () => {
        const result = await LinkColumns.main({
            id: 'my-links',
            theme: 'dark',
            linkColumnSettings: {itemsFlowVert: false},
            links: [{text: 'Link', url: '#'}],
        });
        const doc = parse(result);

        expect(doc.querySelector('section.link-column.dark#my-links')).toBeTruthy();
        expect(doc.querySelector('ul.nav.col-3')).toBeTruthy();
    });

    it('does not render the view-all item when disabled', async () => {
        const result = await LinkColumns.main({
            linkColumnSettings: {viewAllButton: false, viewAllLink: {text: 'View all', url: '#'}},
            links: [{text: 'Item', url: '#'}],
        });

        expect(result).not.toContain('all-link');
    });

    it('escapes unsafe content', async () => {
        const result = await LinkColumns.main({
            links: [{text: '<script>alert(1)</script>', url: '#'}],
            linkColumnSettings: {viewAllButton: true, viewAllLink: {text: '<img src=x onerror=alert(1)>', url: '#'}},
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror');
    });
});
