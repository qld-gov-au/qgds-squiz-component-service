import ImageComponent from './main.js';
import mockData from './example.data.json';

const custom = {imageSource: 'customUrl', src: 'https://example.com/img.jpg', alt: 'Alt'};

describe('Image', () => {
    it('renders the default example data', async () => {
        const result = await ImageComponent.main(mockData);

        expect(result).toContain('<figure');
        expect(result).toContain('image-example-health-workers-md.jpg');
        expect(result).toContain('image-ratio-3x2');
        expect(result).toContain('figure-credit');
    });

    it('renders custom url image with ratio, position, size and lazy loading', async () => {
        const result = await ImageComponent.main({
            imageField: custom,
            ratioClass: 'image-ratio-16x9',
            imagePosition: {positionX: 'position-x-left', positionY: 'position-y-top'},
            customSizeOptions: {width: '400', height: '300'},
            lazy: true,
        });

        expect(result).toContain('src="https://example.com/img.jpg"');
        expect(result).toContain('image-ratio-16x9 ');
        expect(result).toContain('position-x-left');
        expect(result).toContain('width="400px"');
        expect(result).toContain('height="300px"');
        expect(result).toContain('loading="lazy"');
        expect(result).not.toContain('<figure');
    });

    it('escapes XSS in alt, caption and credit', async () => {
        const result = await ImageComponent.main({
            imageField: {...custom, alt: '<script>alert(1)</script>'},
            figCaptionOptions: {caption: '<script>alert(2)</script>', credit: '<script>alert(3)</script>'},
        });

        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    it('renders inline edit attributes in editor mode', async () => {
        const result = await ImageComponent.main({imageField: custom, figCaptionOptions: {caption: 'C', credit: 'D'}}, {ctx: {editor: true}});

        expect(result).toContain('data-sq-field="figCaptionOptions.caption"');
        expect(result).toContain('data-sq-field="figCaptionOptions.credit"');
    });

    it('returns an empty string without a source or input', async () => {
        expect(await ImageComponent.main({})).toBe('');
        expect(await ImageComponent.main(null)).toBe('');
        expect(await ImageComponent.main({imageField: {imageSource: 'squizImage'}})).toBe('');
    });
});
