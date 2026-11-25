import type {BrandLayout} from './types';

export type HeaderPalette = 'dark' | 'default' | 'dark-alt';

const PRE_HEADER_DEFAULT: Record<BrandLayout, HeaderPalette> = {
    masterBrand: 'dark',
    subBrand: 'dark',
    coBrand: 'default',
    endorsedBrand: 'default',
    standaloneBrand: 'dark-alt',
};

const MAIN_DEFAULT: Record<BrandLayout, HeaderPalette> = {
    masterBrand: 'default',
    subBrand: 'default',
    coBrand: 'dark',
    endorsedBrand: 'dark-alt',
    standaloneBrand: 'default',
};

/** Pre-header palette is fixed per Queensland Health brand layout (not editor-configurable). */
export function resolvePreHeaderPaletteClass(brandLayout: BrandLayout | null): HeaderPalette {
    if (!brandLayout) {
        return 'default';
    }
    return PRE_HEADER_DEFAULT[brandLayout];
}

/** Main banner palette is fixed per brand layout (not editor-configurable). */
export function resolveMainPaletteClass(brandLayout: BrandLayout | null, _palette?: string): HeaderPalette {
    if (!brandLayout) {
        return 'default';
    }
    return MAIN_DEFAULT[brandLayout];
}
