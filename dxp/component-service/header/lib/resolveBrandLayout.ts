import type {BrandLayout, HeaderInput} from './types';

export function resolveBrandLayout(input: HeaderInput): BrandLayout | null {
    return input.brandLayout ?? null;
}

export function isMasterGroupLayout(layout: BrandLayout): boolean {
    return layout === 'masterBrand' || layout === 'subBrand' || layout === 'coBrand';
}

export function isEndorsedGroupLayout(layout: BrandLayout): boolean {
    return layout === 'endorsedBrand' || layout === 'standaloneBrand';
}
