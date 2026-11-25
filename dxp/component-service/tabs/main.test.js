import Tabs from './main.js';
import mockData from './example.data.json';

const items = [
    {tabText: 'First', title: 'A', content: '<p>A content</p>'},
    {tabText: 'Second', title: 'B', content: '<p>B content</p>'},
];

describe('Tabs', () => {
    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the default example data', async () => {
        const result = await Tabs.main(mockData);

        expect(result).toContain('class="qld-tabs section-tabs dark');
        expect(result).toContain('Tab label 1');
        expect(result).toContain('Heading (H2)');
        expect(result).toContain('class="scroll scroll-left"');
        expect(result).toContain('class="scroll scroll-right"');
    });

    it('returns an empty string when there are no items', async () => {
        expect(await Tabs.main({tabsSettings: {}, items: []})).toBe('');
        expect(await Tabs.main()).toBe('');
    });

    it('renders container tabs with matching pane ids and targets', async () => {
        const result = await Tabs.main({tabsSettings: {uniqueId: 'ids1'}, items});
        const paneIds = [...result.matchAll(/<section\s+class="tab-pane[^"]*"\s+id="([^"]+)"/g)].map((m) => m[1]);
        const targets = [...result.matchAll(/data-bs-target="#([^"]+)"/g)].map((m) => m[1]);

        expect(result).toContain('class="qld-tabs container-tabs default');
        expect(paneIds.length).toBe(2);
        expect(targets).toEqual(paneIds);
        expect(result).toContain('<h3>A</h3>');
    });

    it('activates the first enabled tab and disables flagged tabs', async () => {
        const result = await Tabs.main({
            items: [{tabText: 'Off', title: 'Off', content: 'x', disabled: true}, ...items],
        });
        const buttons = result.match(/<button\s+class="nav-link[\s\S]*?<\/button>/g);

        expect(buttons.length).toBe(3);
        expect(buttons[0]).toContain('disabled');
        expect(buttons[0]).not.toContain('nav-link active');
        expect(buttons[1]).toContain('nav-link active');
        expect(result.match(/tab-pane fade show active/g).length).toBe(1);
    });

    it('renders the intro section only for section tabs', async () => {
        const settings = {siblingSectionTitle: 'Intro Title', siblingSectionContent: '<p>Intro paragraph</p>'};
        const section = await Tabs.main({tabsSettings: {...settings, typeVariant: 'section-tabs'}, items});
        const container = await Tabs.main({tabsSettings: settings, items});

        expect(section).toContain('Intro Title');
        expect(section).toContain('<h2>A</h2>');
        expect(container).not.toContain('Intro Title');
    });

    it('renders a call to action link when enabled', async () => {
        const result = await Tabs.main({
            items: [{tabText: 'Tab', title: 'T', content: 'C', hasCta: true, ctaLink: {url: 'https://example.com', text: 'Go', target: '_blank'}}],
        });

        expect(result).toContain('qld-cta-link');
        expect(result).toContain('href="https://example.com"');
        expect(result).toContain('Go');
    });

    it('escapes XSS in labels, content, ids and wrapper classes', async () => {
        const result = await Tabs.main({
            tabsSettings: {uniqueId: '"><script>x</script>'},
            wrapperClasses: '" onclick="x',
            items: [{tabText: '<script>x</script>', title: '<script>t</script>', content: '<script>c</script>', icon: '" onclick="y'}],
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="');
    });
});
