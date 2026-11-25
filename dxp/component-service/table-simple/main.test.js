import {describe, expect, it} from 'vitest';
import TableSimple from './main.js';
import mockData from './example.data.json';

describe('Table (Simple)', () => {
    it('renders the default example data', async () => {
        const result = await TableSimple.main(mockData);

        expect(result).toContain('qld-table');
        expect(result).toContain('<table');
        expect(result).toContain('<thead>');
        expect(result).toContain('Footer');
    });

    it('applies variant, striped and hover classes', async () => {
        const result = await TableSimple.main({...mockData, tableSettings: {variantClass: 'dark', striped: true, hover: true}});

        expect(result).toContain('table table-dark table-striped table-hover');
    });

    it('escapes XSS in content and attributes', async () => {
        const result = await TableSimple.main({
            tableContent: '<table><tbody><tr><td><script>alert(1)</script></td></tr></tbody></table>',
            wrapperClasses: '" onclick="x',
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="x');
    });

    it('returns an empty string without content', async () => {
        expect(await TableSimple.main(undefined)).toBe('');
        expect(await TableSimple.main({tableContent: ''})).toBe('');
    });

    it('adds the inline edit field in edit mode', async () => {
        const result = await TableSimple.main(mockData, {ctx: {editor: true}});

        expect(result).toContain('data-sq-field="tableContent"');
    });
});
