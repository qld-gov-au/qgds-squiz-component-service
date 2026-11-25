import {describe, expect, it} from 'vitest';
import {resolveBrandLayout} from './resolveBrandLayout';

describe('resolveBrandLayout', () => {
    it('returns brandLayout when set', () => {
        expect(resolveBrandLayout({brandLayout: 'subBrand'})).toBe('subBrand');
    });

    it('returns null when brandLayout is omitted', () => {
        expect(resolveBrandLayout({})).toBe(null);
    });
});
