import Callout from './main.js';
import mockData from './example.data.json';

describe('Callout', () => {
    it('renders the default example data', async () => {
        const result = await Callout.main(mockData);

        expect(result).toContain('class="callout"');
        expect(result).toContain('This is a callout title');
        expect(result).toContain('callout description');
    });

    it('applies variant and wrapper classes', async () => {
        const result = await Callout.main({content: 'Text', variant: 'dark', wrapperClasses: 'extra'});

        expect(result).toContain('class="dark extra"');
    });

    it('escapes XSS in content, title and attributes', async () => {
        const result = await Callout.main({content: '<script>alert(1)</script>', title: '<script>x</script>', wrapperClasses: '" onclick="x'});

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="x');
    });

    it('omits the title when absent and handles empty input', async () => {
        expect(await Callout.main({content: 'Text'})).not.toContain('callout-title');
        expect(await Callout.main(undefined)).toContain('class="callout"');
    });
});
