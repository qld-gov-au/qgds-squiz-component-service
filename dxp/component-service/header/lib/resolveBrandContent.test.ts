import {describe, expect, it} from 'vitest';
import {resolveBrandContent} from './resolveBrandContent';

describe('resolveBrandContent', () => {
    it('master brand ignores logo and title fields', () => {
        const resolved = resolveBrandContent(
            'masterBrand',
            {},
            {
                logo: {
                    name: 'x',
                    alt: 'x',
                    imageVariations: {
                        original: {
                            url: 'https://example.com/logo.svg',
                            width: 1,
                            height: 1,
                            byteSize: 1,
                            mimeType: 'image/svg+xml',
                            aspectRatio: '1:1',
                            sha1Hash: 'abc',
                        },
                    },
                },
                siteTitle: 'Should not show',
            },
        );

        expect(resolved.primaryCoa).toBe('coa-master-brand');
        expect(resolved.primaryImage).toBeUndefined();
        expect(resolved.siteTitle).toBeUndefined();
    });

    it('sub-brand text lockup uses stacked COA and site title', () => {
        const resolved = resolveBrandContent(
            'subBrand',
            {},
            {
                secondaryLockupType: 'text',
                siteTitle: 'Agency name',
            },
        );

        expect(resolved.primaryCoa).toBe('coa-landscape-2lines');
        expect(resolved.siteTitle).toBe('Agency name');
        expect(resolved.secondaryImage).toBeUndefined();
    });

    it('sub-brand image lockup ignores stale site title', () => {
        const resolved = resolveBrandContent(
            'subBrand',
            {},
            {
                secondaryLockupType: 'image',
                siteTitle: 'Stale title',
                secondaryLogo: {
                    name: 'sec',
                    alt: 'Secondary',
                    imageVariations: {
                        original: {
                            url: 'https://example.com/sec.svg',
                            width: 1,
                            height: 1,
                            byteSize: 1,
                            mimeType: 'image/svg+xml',
                            aspectRatio: '1:1',
                            sha1Hash: 'abc',
                        },
                    },
                },
            },
        );

        expect(resolved.siteTitle).toBeUndefined();
        expect(resolved.secondaryImage).toBeDefined();
    });

    it('co-brand always uses stacked COA modifier class', () => {
        const resolved = resolveBrandContent(
            'coBrand',
            {},
            {
                siteTitle: 'Cairns',
                subline: 'HHS',
                logo: {
                    name: 'ignored',
                    alt: 'ignored',
                    imageVariations: {
                        original: {
                            url: 'https://example.com/ignored.svg',
                            width: 1,
                            height: 1,
                            byteSize: 1,
                            mimeType: 'image/svg+xml',
                            aspectRatio: '1:1',
                            sha1Hash: 'abc',
                        },
                    },
                },
            },
        );

        expect(resolved.primaryCoa).toBe('coa-landscape-2lines');
        expect(resolved.primaryImage).toBeUndefined();
        expect(resolved.brandClassNames).toContain('qld-header-brand--co-brand');
    });
});
