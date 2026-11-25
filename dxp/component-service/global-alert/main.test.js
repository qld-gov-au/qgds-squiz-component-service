import GlobalAlert from './main.js';
import mockData from './example.data.json';

describe('GlobalAlert', () => {
    it('renders the default example data', async () => {
        const result = await GlobalAlert.main(mockData);

        expect(result).toContain('global-alert-include');
        expect(result).toContain('global-alert-critical');
        expect(result).toContain('global-alert-warning');
        expect(result).toContain('global-alert-info');
        expect(result).toContain('qld-icon-alert-danger');
        expect(result).toContain('Read more');
        expect(result).toContain('btn-close');
    });

    it('hides alerts until the client script reveals them, except in the editor', async () => {
        const item = {alertItems: [{variant: 'global-alert-info', content: 'Hi'}]};

        expect(await GlobalAlert.main(item)).toContain('d-none');
        expect(await GlobalAlert.main(item, {ctx: {editor: true}})).not.toContain('d-none');
    });

    it('omits the close button when dismissal is prevented', async () => {
        const result = await GlobalAlert.main({alertItems: [{variant: 'global-alert-info', content: 'Hi', preventDismiss: true}]});

        expect(result).not.toContain('btn-close');
    });

    it('escapes XSS in content and wrapper classes', async () => {
        const result = await GlobalAlert.main({
            wrapperClasses: '" onclick="x',
            alertItems: [{variant: 'global-alert-info', content: '<script>alert(1)</script>'}],
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="x');
    });

    it('handles empty input', async () => {
        expect(await GlobalAlert.main(undefined)).toContain('global-alert-include');
    });
});
