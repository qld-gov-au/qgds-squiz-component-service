import Modal from './main.js';
import mockData from './example.data.json';

describe('Modal', () => {
    it('renders the default example data', async () => {
        const result = await Modal.main(mockData);

        expect(result).toContain('class="modal fade"');
        expect(result).toContain('Modal title');
        expect(result).toContain('modal-footer');
        expect(result).toContain('Open modal');
    });

    it('uses a sanitised custom id and size class', async () => {
        const result = await Modal.main({content: 'Hi', modalSize: 'large', modalIdSettings: {modalIdSource: 'custom', customModalId: 'my modal!'}});

        expect(result).toContain('id="my-modal-"');
        expect(result).toContain('modal-dialog modal-lg');
    });

    it('escapes XSS in content, title and wrapper classes', async () => {
        const result = await Modal.main({
            content: '<script>alert(1)</script>',
            header: {title: '<script>x</script>'},
            wrapperClasses: '" onclick="x',
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="x');
    });

    it('handles empty input', async () => {
        const result = await Modal.main(undefined);

        expect(result).toContain('modal-body');
        expect(result).not.toContain('modal-header');
    });
});
