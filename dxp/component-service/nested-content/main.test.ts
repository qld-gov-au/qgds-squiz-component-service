import {describe, expect, it, vi} from 'vitest';
import nestedContent, {buildEsiInclude, getAssetUrl, hasMatrixAssetSelection, mergePageSearchParams, PAGES_QUERY} from './main.ts';
import type {NestedContentInfo} from './types.ts';

// Fixture URLs only. No live Matrix Content API / AMAPI calls.
const mockUrl = 'https://orv-web.matrix.squiz.cloud/orv/sandbox/qa/nested-content/rich-content-example';
const assetUri = 'matrix-asset://api-identifier/1111';

type ResolveUri = NonNullable<NonNullable<NestedContentInfo['fns']>['resolveUri']>;

function mockInfo(resolveUri: ResolveUri = vi.fn(() => Promise.resolve({url: mockUrl})), ctx?: NestedContentInfo['ctx']): NestedContentInfo {
    const info: NestedContentInfo = {fns: {resolveUri}};
    if (ctx !== undefined) {
        info.ctx = ctx;
    }
    return info;
}

describe('hasMatrixAssetSelection', () => {
    it.each([
        [assetUri, true],
        [`  ${assetUri}  `, true],
    ])('returns true for %s', (value, expected) => {
        expect(hasMatrixAssetSelection(value)).toBe(expected);
    });

    it.each([
        [undefined, false],
        [null, false],
        ['', false],
        ['   ', false],
        [123, false],
    ])('returns false for %s', (value, expected) => {
        expect(hasMatrixAssetSelection(value)).toBe(expected);
    });
});

describe('buildEsiInclude', () => {
    it('builds an ESI include with the read-only async session query', () => {
        expect(buildEsiInclude(mockUrl)).toBe(`<esi:include src="${mockUrl}?${PAGES_QUERY}" />`);
    });

    it('uses & when the asset URL already has a query string', () => {
        expect(buildEsiInclude(`${mockUrl}?foo=bar`)).toBe(`<esi:include src="${mockUrl}?foo=bar&${PAGES_QUERY}" />`);
    });

    it('forwards non-SQ page query params onto the ESI src URL', () => {
        const pageHref = 'https://example.com/page?water=Albert%20Park%20Lake&utm=1';
        const result = buildEsiInclude(mockUrl, pageHref);
        const parsed = new URL(result.match(/src="([^"]+)"/)![1]);

        expect(parsed.searchParams.get('SQ_ASSET_CONTENTS_RAW')).toBe('');
        expect(parsed.searchParams.get('SQ_SESSION_MODE')).toBe('read_only_async');
        expect(parsed.searchParams.get('water')).toBe('Albert Park Lake');
        expect(parsed.searchParams.get('utm')).toBe('1');
    });

    it('does not forward SQ_ params from the page URL', () => {
        const pageHref = 'https://example.com/page?water=X&SQ_DESIGN_NAME=preview';
        const result = buildEsiInclude(mockUrl, pageHref);
        const parsed = new URL(result.match(/src="([^"]+)"/)![1]);

        expect(parsed.searchParams.get('water')).toBe('X');
        expect(parsed.searchParams.has('SQ_DESIGN_NAME')).toBe(false);
        expect(parsed.searchParams.get('SQ_SESSION_MODE')).toBe('read_only_async');
    });
});

describe('mergePageSearchParams', () => {
    const requestUrl = `${mockUrl}?${PAGES_QUERY}`;

    it('returns the request URL when pageHref is missing', () => {
        expect(mergePageSearchParams(requestUrl, undefined)).toBe(requestUrl);
    });

    it('returns the request URL when the page has no search params', () => {
        expect(mergePageSearchParams(requestUrl, 'https://example.com/contact')).toBe(requestUrl);
    });

    it('returns the request URL when URLs cannot be parsed', () => {
        expect(mergePageSearchParams('not-a-url', 'also-not-a-url')).toBe('not-a-url');
    });
});

describe('getAssetUrl', () => {
    it('returns the URL from a resolveUri response', async () => {
        const url = await getAssetUrl(assetUri, mockInfo());
        expect(url).toBe(mockUrl);
    });

    it('returns an empty string without calling resolveUri when URI is missing', async () => {
        const resolveUri = vi.fn(() => Promise.resolve({url: mockUrl}));
        const url = await getAssetUrl(undefined, mockInfo(resolveUri as never));

        expect(url).toBe('');
        expect(resolveUri).not.toHaveBeenCalled();
    });

    it('returns an empty string when resolveUri throws', async () => {
        const url = await getAssetUrl(assetUri, mockInfo(vi.fn(() => Promise.reject(new Error('resolve failed'))) as never));
        expect(url).toBe('');
    });
});

describe('nestedContent main', () => {
    it('returns an ESI include for a valid asset', async () => {
        const result = await nestedContent.main({matrixAsset: assetUri}, mockInfo());

        expect(result).toBe(buildEsiInclude(mockUrl));
    });

    it('forwards page query params from info.ctx.url into the ESI include', async () => {
        const pageHref = 'https://example.com/page?water=Albert%20Park%20Lake';
        const result = await nestedContent.main({matrixAsset: assetUri}, mockInfo(undefined, {url: new URL(pageHref)}));

        expect(result).toBe(buildEsiInclude(mockUrl, pageHref));
    });

    it.each([
        ['missing property', {}],
        ['undefined input', undefined],
        ['undefined', {matrixAsset: undefined}],
        ['empty string', {matrixAsset: ''}],
        ['whitespace only', {matrixAsset: '   '}],
    ])('returns a configuration error without calling resolveUri when %s', async (_label, input) => {
        const resolveUri = vi.fn(() => Promise.resolve({url: mockUrl}));
        const result = await nestedContent.main(input as never, mockInfo(resolveUri as never));

        expect(result).toContain('Unable to resolve a URL');
        expect(result).toContain('nested-content__error');
        expect(resolveUri).not.toHaveBeenCalled();
    });

    it('returns a configuration error when resolveUri returns no URL', async () => {
        const result = await nestedContent.main({matrixAsset: 'matrix-asset://api-identifier/9999'}, mockInfo(vi.fn(() => Promise.resolve({})) as never));

        expect(result).toContain('Unable to resolve a URL');
        expect(result).toContain('matrix-asset://api-identifier/9999');
    });

    it('returns a configuration error when resolveUri throws', async () => {
        const result = await nestedContent.main({matrixAsset: assetUri}, mockInfo(vi.fn(() => Promise.reject(new Error('resolve failed'))) as never));

        expect(result).toContain('Unable to resolve a URL');
    });

    it('escapes markup in the asset URI within the error message', async () => {
        const malicious = 'matrix-asset://x/<img src=x onerror=alert(1)>';
        const result = await nestedContent.main({matrixAsset: malicious}, mockInfo(vi.fn(() => Promise.resolve({})) as never));

        expect(result).toContain('Unable to resolve a URL');
        expect(result).toContain('&lt;img');
        expect(result).not.toContain('<img');
    });
});
