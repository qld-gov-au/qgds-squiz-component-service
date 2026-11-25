import ButtonList from './main.js';
import mockData from './example.data.json';

describe('Button list', () => {
    it('renders the default example data', async () => {
        const result = await ButtonList.main(mockData);

        expect(result).toContain('class="btn btn-primary"');
        expect(result).toContain('class="btn btn-secondary"');
        expect(result).toContain('Call to action primary');
        expect(result).toContain('href="https://google.com"');
        expect(result).toContain('qld-icon-external-link');
    });

    it('adds inline edit attributes in editor mode', async () => {
        const result = await ButtonList.main(mockData, {ctx: {editor: true}});

        expect(result).toContain('data-sq-field="buttons[0].link"');
        expect(result).toContain('data-sq-field="buttons[1].label"');
    });

    it('escapes XSS in label, classes and href', async () => {
        const result = await ButtonList.main({
            wrapperClasses: '" onclick="x',
            buttons: [{label: '<script>alert(1)</script>', className: '" onclick="y', link: {url: '" onclick="z'}}],
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick=');
    });

    it('returns an empty string when there are no buttons', async () => {
        expect(await ButtonList.main({})).toBe('');
        expect(await ButtonList.main(undefined)).toBe('');
    });
});
