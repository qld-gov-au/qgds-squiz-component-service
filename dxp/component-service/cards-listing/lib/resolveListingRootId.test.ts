import {describe, expect, it} from 'vitest';
import {resolveListingRootId} from './resolveListingRootId';

describe('resolveListingRootId', () => {
    it('uses the current page asset for the current source', () => {
        const id = resolveListingRootId({source: 'current'}, {ctx: {assetId: '465'}});

        expect(id).toBe('465');
    });

    it('defaults to the current page asset when no source is set', () => {
        expect(resolveListingRootId(undefined, {ctx: {assetId: '12'}})).toBe('12');
    });

    it('parses the asset id from a matrix-asset URI for the custom source', () => {
        const id = resolveListingRootId({source: 'custom', rootNode: 'matrix-asset://tgh1-web/2053'}, {ctx: {assetId: '465'}});

        expect(id).toBe('2053');
    });

    it('returns empty for a custom source without a root node', () => {
        expect(resolveListingRootId({source: 'custom'}, undefined)).toBe('');
    });

    it.each(['https://example.com/page', 'matrix-asset://tgh1-web/not-a-number', 'matrix-asset://tgh1-web/', 'matrix-asset:///2053', '2053'])(
        'returns empty for an invalid root node %s',
        (rootNode) => {
            expect(resolveListingRootId({source: 'custom', rootNode}, {ctx: {assetId: '465'}})).toBe('');
        },
    );

    it('returns empty for the current source without a page asset', () => {
        expect(resolveListingRootId({source: 'current'}, undefined)).toBe('');
    });
});
