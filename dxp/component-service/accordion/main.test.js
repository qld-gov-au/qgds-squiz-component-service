import Accordion from './main.js';
import mockData from './example.data.json';

describe('Accordion', () => {
    it('renders the default example data', async () => {
        const result = await Accordion.main(mockData);

        expect(result).toContain('class="accordion-group"');
        expect(result).toContain('id="accordion-group-1"');
        expect(result).toContain('accordion-toggle-btn');
        expect((result.match(/class="accordion-item"/g) || []).length).toBe(mockData.accordionItems.length);
        expect(result).toContain('<h2 class="accordion-header" id="heading-One">');
    });

    it('defaults the heading tag to h2 and honours a custom one', async () => {
        const {headingTag, ...rest} = mockData;
        expect(await Accordion.main(rest)).toContain('<h2 class="accordion-header"');
        expect(await Accordion.main({...mockData, headingTag: 'h4'})).toContain('<h4 class="accordion-header"');
    });

    it('omits the toggle all button when toggleAll is false', async () => {
        const result = await Accordion.main({...mockData, toggleAll: false});

        expect(result).not.toContain('accordion-toggle-btn');
    });

    it('escapes XSS in title and content', async () => {
        const result = await Accordion.main({
            groupId: 'g',
            accordionItems: [{id: 'x', title: '<script>alert("xss")</script>', content: '<img src=x onerror=alert(1)>'}],
        });

        expect(result).not.toContain('<script>alert("xss")</script>');
        expect(result).not.toContain('<img src=x onerror=alert(1)>');
    });

    it('returns an empty string for empty input', async () => {
        expect(await Accordion.main({})).toBe('');
        expect(await Accordion.main()).toBe('');
        expect(await Accordion.main({groupId: 'g', accordionItems: []})).toBe('');
    });
});
