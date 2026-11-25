import {describe, expect, it} from 'vitest';
import {editorSqField, escapeAttribute, hasSafeLinkUrl, linkHref, linkTargetAttribute, safeUrl} from './attributes.ts';

describe('hasSafeLinkUrl', () => {
    it('is true only for a non-empty, safe URL', () => {
        expect(hasSafeLinkUrl({url: 'https://example.com'})).toBe(true);
        expect(hasSafeLinkUrl({url: '/contact'})).toBe(true);
        expect(hasSafeLinkUrl({url: 'javascript:alert(1)'})).toBe(false);
        expect(hasSafeLinkUrl({text: 'No URL'})).toBe(false);
        // An asset pick that resolved to a name but no URL has nothing to link to.
        expect(hasSafeLinkUrl({matrixAssetId: '8', text: 'Mock Asset'})).toBe(false);
        expect(hasSafeLinkUrl(undefined)).toBe(false);
    });
});

describe('escapeAttribute', () => {
    it('escapes quotes, ampersands and angle brackets', () => {
        expect(escapeAttribute(`a&b "c" <d> 'e'`)).toBe('a&amp;b &quot;c&quot; &lt;d&gt; &#39;e&#39;');
    });
});

describe('safeUrl', () => {
    it('returns the trimmed value for ordinary URLs', () => {
        expect(safeUrl('  https://example.com/a  ')).toBe('https://example.com/a');
    });

    it('keeps relative, mailto and tel URLs', () => {
        expect(safeUrl('/contact')).toBe('/contact');
        expect(safeUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
        expect(safeUrl('tel:0700000000')).toBe('tel:0700000000');
    });

    it('returns the fallback for empty input', () => {
        expect(safeUrl('')).toBe('#');
        expect(safeUrl(undefined)).toBe('#');
        expect(safeUrl(undefined, '/fallback')).toBe('/fallback');
    });

    it.each(['javascript:alert(1)', '  JavaScript:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,<script>alert(1)</script>'])('blocks unsafe scheme %s', (value) => {
        expect(safeUrl(value)).toBe('#');
    });
});

describe('linkHref', () => {
    it('escapes the resolved URL', () => {
        expect(linkHref({url: 'https://x.example/?a=1&b="2"', text: 't'})).toBe('https://x.example/?a=1&amp;b=&quot;2&quot;');
    });

    it('uses the fallback when the link has no URL', () => {
        expect(linkHref({text: 't'}, 'https://www.qld.gov.au/contact-us')).toBe('https://www.qld.gov.au/contact-us');
        expect(linkHref(undefined)).toBe('#');
    });

    it('blocks unsafe schemes', () => {
        expect(linkHref({url: 'javascript:alert(1)', text: 't'})).toBe('#');
    });

    it('does not let a quote break out of the attribute', () => {
        expect(linkHref({url: 'x" onmouseover="alert(1)', text: 't'})).toBe('x&quot; onmouseover=&quot;alert(1)');
    });
});

describe('linkTargetAttribute', () => {
    it('returns a target attribute with a leading space', () => {
        expect(linkTargetAttribute({url: '/a', target: '_blank'})).toBe(' target="_blank"');
    });

    it('returns nothing without a target', () => {
        expect(linkTargetAttribute({url: '/a'})).toBe('');
        expect(linkTargetAttribute(undefined)).toBe('');
    });

    it('escapes the target', () => {
        expect(linkTargetAttribute({url: '/a', target: 'x" onclick="y'})).toBe(' target="x&quot; onclick=&quot;y"');
    });
});

describe('editorSqField', () => {
    it('returns nothing outside edit mode', () => {
        expect(editorSqField(false, 'sitename')).toBe('');
    });

    it('returns a leading-space data-sq-field attribute in edit mode', () => {
        expect(editorSqField(true, 'sitename')).toBe(' data-sq-field="sitename"');
    });
});
