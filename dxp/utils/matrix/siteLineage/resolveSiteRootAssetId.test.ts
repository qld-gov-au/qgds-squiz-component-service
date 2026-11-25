import {describe, expect, it} from 'vitest';
import {DEFAULT_SITE_ROOT_ASSET_ID, resolveSiteRootAssetId} from './resolveSiteRootAssetId.js';

describe('resolveSiteRootAssetId', () => {
    it('returns Arts default when env is empty', () => {
        expect(resolveSiteRootAssetId()).toBe('465');
        expect(DEFAULT_SITE_ROOT_ASSET_ID).toBe('465');
    });

    it('prefers author override over component set env', () => {
        expect(resolveSiteRootAssetId({env: {SITE_ROOT_ASSET_ID: '12345'}}, {override: '999'})).toBe('999');
    });

    it('prefers component set env', () => {
        expect(resolveSiteRootAssetId({env: {SITE_ROOT_ASSET_ID: '12345'}})).toBe('12345');
    });
});
