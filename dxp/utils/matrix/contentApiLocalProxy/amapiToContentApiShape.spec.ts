import {describe, expect, it} from 'vitest';
import {amapiAssetToLineageAsset} from './amapiToContentApiShape.js';

describe('[amapiAssetToLineageAsset]', () => {
    it('maps AMAPI metadata_values onto Content API metadata', () => {
        const asset = amapiAssetToLineageAsset({
            id: '465',
            type: 'site',
            attributes: {name: 'NSW RFS Website'},
            metadata_values: {
                socialFacebookUrl: {value: 'https://www.facebook.com/nswrfs'},
                footerLinks: {value: ['471', '472']},
            },
        });

        expect(asset?.metadata).toEqual({
            socialFacebookUrl: {value: 'https://www.facebook.com/nswrfs'},
            footerLinks: {value: ['471', '472']},
        });
    });

    it('prefers metadata over metadata_values when both are present', () => {
        const asset = amapiAssetToLineageAsset({
            id: '465',
            type: 'site',
            metadata: {
                socialFacebookUrl: {value: 'https://from-metadata.example'},
            },
            metadata_values: {
                socialFacebookUrl: {value: 'https://from-values.example'},
            },
        });

        expect(asset?.metadata).toEqual({
            socialFacebookUrl: {value: 'https://from-metadata.example'},
        });
    });

    it('reads metadata_values from a wrapped { asset } payload', () => {
        const asset = amapiAssetToLineageAsset({
            asset: {
                id: '465',
                type: 'site',
                metadata_values: {
                    rssFeedUrl: {value: 'https://example.com/feed'},
                },
            },
        });

        expect(asset?.metadata).toEqual({
            rssFeedUrl: {value: 'https://example.com/feed'},
        });
    });
});
