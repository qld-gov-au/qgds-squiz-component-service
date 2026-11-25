import InpageAlert from './main.js';
import mockData from './example.data.json';

describe('InpageAlert', () => {
    it('renders the default example data', async () => {
        const result = await InpageAlert.main(mockData);

        expect(result).toContain('class="alert alert-success"');
        expect(result).toContain('role="alert"');
        expect(result).toContain('aria-label="Success alert"');
        expect(result).toContain('Alert heading');
        expect(result).toContain('Find out more');
    });

    it('renders the correct class and aria-label for each variant', async () => {
        for (const variant of ['info', 'success', 'warning', 'error']) {
            const result = await InpageAlert.main({variantClass: variant, content: 'Text.'});
            expect(result).toContain(`alert alert-${variant}`);
        }
    });

    it('supports custom heading tag, aria-label and wrapper classes', async () => {
        const result = await InpageAlert.main({heading: 'Title', headingTag: 'h3', content: 'Body.', ariaLabel: 'Custom label', wrapperClasses: 'extra'});

        expect(result).toContain('<h3');
        expect(result).toContain('</h3>');
        expect(result).toContain('aria-label="Custom label"');
        expect(result).toContain('alert alert-info extra');
    });

    it('renders edit mode fields when editor context is true', async () => {
        const result = await InpageAlert.main({heading: 'Title', content: 'Content.'}, {ctx: {editor: true}});

        expect(result).toContain('data-sq-field="heading"');
        expect(result).toContain('data-sq-field="content"');
    });

    it('escapes XSS in content, heading, attributes and heading tag', async () => {
        const result = await InpageAlert.main({
            heading: '<script>x</script>',
            headingTag: 'script',
            content: '<script>alert(1)</script>',
            ariaLabel: '" onclick="x',
            wrapperClasses: '" onclick="y',
        });

        expect(result).not.toContain('<script');
        expect(result).not.toContain('" onclick=');
    });

    it('returns an empty string when there is no heading or content', async () => {
        expect(await InpageAlert.main({})).toBe('');
        expect(await InpageAlert.main(undefined)).toBe('');
    });
});
