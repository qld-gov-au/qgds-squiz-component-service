import {xssSafeContent} from '../../utils/xss.js';
import Table from './main.js';
import mockData from './example.data.json';

describe('Table', () => {
    it('renders the default example data', async () => {
        const result = await Table.main(mockData);

        expect(result).toContain('<table class="table"');
        expect(result).toContain('Table caption');
        expect(result).toContain('2021 - 2024');
        expect(result).toContain('<thead>');
        expect(result).toContain('<tfoot>');
        expect(result).toContain('qg-correct');
        expect(result).toContain('qg-incorrect');
    });

    it('applies variant, striped and hover classes', async () => {
        const result = await Table.main({...mockData, tableSettings: {variantClass: 'dark', striped: true, hover: true}});

        expect(result).toContain('table table-dark table-striped table-hover');
        expect(result).not.toContain('qg-correct');
    });

    it('escapes XSS in content and attributes', async () => {
        const result = await Table.main({
            captionOptions: {caption: '<script>alert(1)</script>'},
            rowsOptions: {rows: [{cells: [{value: '<script>x</script>'}]}]},
            wrapperClasses: '" onclick="x',
        });

        expect(result).toContain(xssSafeContent('<script>alert(1)</script>'));
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="x');
    });

    it('handles empty input', async () => {
        const result = await Table.main(undefined);

        expect(result).toContain('<table');
        expect(result).not.toContain('<caption');
        expect(result).not.toContain('<thead>');
        expect(result).not.toContain('<tfoot>');
    });

    it('adds inline edit fields in edit mode', async () => {
        const result = await Table.main(mockData, {ctx: {editor: true}});

        expect(result).toContain('data-sq-field="captionOptions.caption"');
        expect(result).toContain('data-sq-field="rowsOptions.rows[0].cells[0].value"');
    });
});
