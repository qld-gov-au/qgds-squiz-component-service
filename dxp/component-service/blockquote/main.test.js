import {xssSafeContent} from '../../utils/xss.js';
import Blockquote from './main.js';
import mockData from './example.data.json';

describe('Blockquote', () => {
    it('renders the default example data', async () => {
        const result = await Blockquote.main(mockData);

        expect(result).toContain('<figure class="blockquote');
        expect(result).toContain('Sir Tim Berners-Lee');
        expect(result).toContain(`cite="${mockData.citeUrl}"`);
    });

    it('escapes XSS in content and attributes', async () => {
        const result = await Blockquote.main({content: '<script>alert(1)</script>', citeUrl: '"><script>x</script>', classes: '" onclick="x'});

        expect(result).toContain(xssSafeContent('<script>alert(1)</script>'));
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="x');
    });

    it('returns empty output without content unless in edit mode', async () => {
        expect(await Blockquote.main({})).toBe('');
        expect(await Blockquote.main(undefined)).toBe('');
        const edit = await Blockquote.main({}, {ctx: {editor: true}});
        expect(edit).toContain('data-sq-field="content"');
        expect(edit).toContain('data-sq-field="citeText"');
    });

    it('omits the figcaption when there is no author', async () => {
        const result = await Blockquote.main({content: 'Quote'});

        expect(result).not.toContain('figcaption');
    });
});
