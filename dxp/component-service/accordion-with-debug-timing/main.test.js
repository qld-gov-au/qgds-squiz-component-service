import {xssSafeContent} from '../../utils/xss';
import AccordionWithDebugTiming from './main.js';

const mockData = {
    title: 'Accordion Section',
    accordion: [
        {heading: 'Heading 1', content: 'Content 1'},
        {heading: 'Heading 2', content: 'Content 2'},
        {heading: 'Heading 3', content: 'Content 3'},
    ],
};

describe('AccordionWithDebugTiming', () => {
    it('should return valid HTML structure', async () => {
        const result = await AccordionWithDebugTiming.main(mockData);

        expect(result).toBeDefined();
        expect(result).toContain('<section class="accordion">');
    });

    it('should render the title if provided', async () => {
        const result = await AccordionWithDebugTiming.main(mockData);

        expect(result).toContain('<h2 class="heading-secondary">Accordion Section</h2>');
    });

    it('should not render the title if it is null or undefined', async () => {
        const dataWithoutTitle = {...mockData, title: null};
        const result = await AccordionWithDebugTiming.main(dataWithoutTitle);

        expect(result).not.toContain('<h2 class="heading-secondary">');
    });

    it('should not render the heading tag if title is empty', async () => {
        const dataWithoutTitle = {...mockData, title: ''};
        const result = await AccordionWithDebugTiming.main(dataWithoutTitle);

        expect(result).not.toContain('<h2 class="heading-secondary">');
        expect(result).toContain('<section class="accordion">');
    });

    it('should render all accordion items', async () => {
        const result = await AccordionWithDebugTiming.main(mockData);
        const detailsCount = (result.match(/<details class="accordion__item">/g) || []).length;
        expect(detailsCount).toBe(mockData.accordion.length);
    });

    it('should not render accordion items if the array is empty', async () => {
        const emptyAccordionData = {...mockData, accordion: []};
        const result = await AccordionWithDebugTiming.main(emptyAccordionData);

        expect(result).not.toContain('<details class="accordion__item">');
    });

    it('should escape XSS in content', async () => {
        const accordionDataWithScripts = {
            ...mockData,
            accordion: [
                {
                    title: 'Heading 1',
                    content: '<script>alert("xss")</script>',
                },
                {
                    title: 'Heading 2',
                    content: '<img src=x onerror=alert(1)>',
                },
            ],
        };

        const result = await AccordionWithDebugTiming.main(accordionDataWithScripts);

        expect(result).toContain(xssSafeContent('<script>alert("xss")</script>'));
        expect(result).toContain(xssSafeContent('<img src=x onerror=alert(1)>'));
        expect(result).not.toContain('<script>alert("xss")</script>');
        expect(result).not.toContain('<img src=x onerror=alert(1)>');
    });

    it('should not emit [CMP DEBUG] timing logs when CMP_DEBUG_TIMING is unset', async () => {
        const previousValue = process.env.CMP_DEBUG_TIMING;
        delete process.env.CMP_DEBUG_TIMING;

        const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

        await AccordionWithDebugTiming.main(mockData);

        const messages = debugSpy.mock.calls.map(([message]) => message);
        expect(messages.some((message) => message.includes('[CMP DEBUG]'))).toBe(false);

        debugSpy.mockRestore();
        if (previousValue === undefined) {
            delete process.env.CMP_DEBUG_TIMING;
        } else {
            process.env.CMP_DEBUG_TIMING = previousValue;
        }
    });

    it('should emit [CMP DEBUG] timing logs when CMP_DEBUG_TIMING=true', async () => {
        const previousValue = process.env.CMP_DEBUG_TIMING;
        process.env.CMP_DEBUG_TIMING = 'true';

        const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

        await AccordionWithDebugTiming.main(mockData);

        const messages = debugSpy.mock.calls.map(([message]) => message);
        expect(messages.some((message) => message.includes('[CMP DEBUG] accordion-with-debug-timing main started'))).toBe(true);
        expect(messages.some((message) => message.includes('config ready'))).toBe(true);
        expect(messages.some((message) => message.includes('starting HTML markup render'))).toBe(true);
        expect(messages.some((message) => message.includes('HTML markup render complete length='))).toBe(true);
        expect(messages.some((message) => message.includes('main complete'))).toBe(true);

        debugSpy.mockRestore();
        if (previousValue === undefined) {
            delete process.env.CMP_DEBUG_TIMING;
        } else {
            process.env.CMP_DEBUG_TIMING = previousValue;
        }
    });
});
