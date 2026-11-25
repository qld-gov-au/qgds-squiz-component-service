import {specificTagChanges, xssSafeContent} from './xss';

const circleAttrCount = specificTagChanges.circle.length;

describe('xssSafeContent', () => {
    describe('XSS stripping', () => {
        it('should strip script tags', () => {
            const result = xssSafeContent('<script>alert(1)</script>');

            expect(result).not.toContain('<script');
            expect(result).toContain('&lt;script&gt;');
        });

        it('should strip img onerror handlers', () => {
            const result = xssSafeContent('<img src=x onerror=alert(1)>');

            expect(result).not.toContain('onerror');
        });

        it('should strip javascript href values', () => {
            const result = xssSafeContent('<a href="javascript:alert(1)">link</a>');

            expect(result).not.toContain('javascript:');
        });
    });

    describe('addToAll on standard HTML', () => {
        it('should allow class, id, and aria-label on paragraph tags', () => {
            const result = xssSafeContent('<p class="foo" id="bar" aria-label="hi">text</p>');

            expect(result).toContain('class="foo"');
            expect(result).toContain('id="bar"');
            expect(result).toContain('aria-label="hi"');
        });
    });

    describe('SVG tags and specificTagChanges attrs', () => {
        it('should allow svg and path with configured attributes', () => {
            const svg = '<svg width="100" height="50" viewBox="0 0 100 50"><path d="M0 0" fill="red" stroke="black"/></svg>';
            const result = xssSafeContent(svg);

            expect(result).toContain('<svg');
            expect(result).toContain('viewbox');
            expect(result).toContain('<path');
            expect(result).toContain('d="M0 0"');
        });
    });

    describe('addToAll on SVG elements', () => {
        it('should allow class and aria-hidden on circle tags', () => {
            const result = xssSafeContent('<circle cx="1" cy="2" r="3" class="dot" aria-hidden="true"/>');

            expect(result).toContain('class="dot"');
            expect(result).toContain('aria-hidden="true"');
        });
    });

    describe('empty SVG overrides', () => {
        it('should still allow addToAll attrs on defs and clipPath', () => {
            const result = xssSafeContent('<defs class="icons" id="sprite"><clipPath id="clip1"/></defs>');

            expect(result).toContain('class="icons"');
            expect(result).toContain('id="sprite"');
            expect(result).toContain('id="clip1"');
        });
    });

    describe('specificTagChanges immutability', () => {
        it('should not mutate specificTagChanges when building or using the whitelist', () => {
            xssSafeContent('<circle cx="1" cy="2" r="3" class="dot"/>');
            xssSafeContent('<circle cx="1" cy="2" r="3" class="dot"/>');

            expect(specificTagChanges.circle.length).toBe(circleAttrCount);
            expect(specificTagChanges.circle).toEqual(['cx', 'cy', 'r', 'stroke', 'stroke-width', 'fill']);
        });
    });
});
