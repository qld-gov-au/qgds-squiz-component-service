import {describe, expect, it} from 'vitest';
import {resolveDescriptionMetadataFieldKey, resolveNavigationLayout} from './resolveHeaderNavigationConfig';

describe('resolveHeaderNavigationConfig', () => {
    it('defaults navigation layout to simpleList', () => {
        expect(resolveNavigationLayout(undefined)).toBe('simpleList');
        expect(resolveNavigationLayout({brandLayout: 'masterBrand'})).toBe('simpleList');
        expect(resolveNavigationLayout({navigation: {layout: 'simpleList'}})).toBe('simpleList');
    });

    it('resolves megaMenu when configured', () => {
        expect(resolveNavigationLayout({navigation: {layout: 'megaMenu'}})).toBe('megaMenu');
    });

    it('reads descriptionMetadataFieldKey when set', () => {
        expect(
            resolveDescriptionMetadataFieldKey({
                navigation: {
                    layout: 'megaMenu',
                    descriptionMetadataFieldKey: 'page-lead',
                },
            }),
        ).toBe('page-lead');
    });

    it('falls back to legacy descriptionMetadataFieldAssetId', () => {
        expect(
            resolveDescriptionMetadataFieldKey({
                navigation: {
                    layout: 'megaMenu',
                    descriptionMetadataFieldAssetId: 'legacy-key',
                },
            }),
        ).toBe('legacy-key');
    });

    it('prefers descriptionMetadataFieldKey over legacy id', () => {
        expect(
            resolveDescriptionMetadataFieldKey({
                navigation: {
                    descriptionMetadataFieldKey: 'page-lead',
                    descriptionMetadataFieldAssetId: '1054',
                },
            }),
        ).toBe('page-lead');
    });
});
