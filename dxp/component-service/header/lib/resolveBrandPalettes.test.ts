import {describe, expect, it} from 'vitest';
import {resolveMainPaletteClass, resolvePreHeaderPaletteClass} from './resolveBrandPalettes';

describe('resolveBrandPalettes', () => {
    it('derives main palette from brand layout only', () => {
        expect(resolveMainPaletteClass('masterBrand', 'dark-alt')).toBe('default');
        expect(resolveMainPaletteClass('coBrand')).toBe('dark');
        expect(resolveMainPaletteClass('endorsedBrand')).toBe('dark-alt');
        expect(resolveMainPaletteClass(null)).toBe('default');
    });

    it('derives pre-header palette from brand layout only', () => {
        expect(resolvePreHeaderPaletteClass('masterBrand')).toBe('dark');
        expect(resolvePreHeaderPaletteClass('coBrand')).toBe('default');
        expect(resolvePreHeaderPaletteClass('standaloneBrand')).toBe('dark-alt');
        expect(resolvePreHeaderPaletteClass(null)).toBe('default');
    });

    it('uses endorsed layout defaults for pre-header and main', () => {
        expect(resolveMainPaletteClass('endorsedBrand')).toBe('dark-alt');
        expect(resolvePreHeaderPaletteClass('endorsedBrand')).toBe('default');
    });
});
