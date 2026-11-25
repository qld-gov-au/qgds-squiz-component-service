import PromotionalPanel from './main.js';
import mockData from './example.data.json';

describe('Promotional Panel', () => {
    it('renders the default example data', async () => {
        const result = await PromotionalPanel.main(mockData);

        expect(result).toContain('qld-promo-panel indent-text indent');
        expect(result).toContain('https://picsum.photos/536/354');
        expect(result).toContain('Title goes here');
        expect(result).toContain('qld-cta-link');
        expect(result).toContain('btn btn-secondary');
    });

    it('uses a background image for the promo type', async () => {
        const result = await PromotionalPanel.main({...mockData, type: 'promo'});

        expect(result).toContain('background-image: url(https://picsum.photos/536/354)');
        expect(result).not.toContain('promo-panel-image');
    });

    it('escapes XSS in title and alt', async () => {
        const result = await PromotionalPanel.main({
            ...mockData,
            title: '<script>alert(1)</script>',
            promoImageField: {imageSource: 'customUrl', src: 'x.jpg', alt: '"><script>alert(2)</script>'},
        });

        expect(result).not.toContain('<script>');
    });

    it('handles empty input', async () => {
        const result = await PromotionalPanel.main({});

        expect(result).toContain('qld-promo-panel');
    });
});
