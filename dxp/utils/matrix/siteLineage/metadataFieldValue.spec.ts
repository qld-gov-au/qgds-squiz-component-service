import {describe, expect, it} from 'vitest';
import {extractMetadataStringByFieldKey} from './metadataFieldValue.js';

describe('extractMetadataStringByFieldKey', () => {
    it('returns empty string when metadata or field key is missing', () => {
        expect(extractMetadataStringByFieldKey(null, 'page-lead')).toBe('');
        expect(extractMetadataStringByFieldKey({}, '')).toBe('');
    });

    it('reads Arts page-lead metadata_field_text shape', () => {
        expect(
            extractMetadataStringByFieldKey(
                {
                    'page-lead': {
                        type: 'metadata_field_text',
                        value: "Arts Queensland invests in the state's arts and cultural sector.",
                    },
                },
                'page-lead',
            ),
        ).toBe("Arts Queensland invests in the state's arts and cultural sector.");
    });

    it('reads scalar values by metadata key', () => {
        expect(extractMetadataStringByFieldKey({'999': 'Child blurb'}, '999')).toBe('Child blurb');
    });

    it('unwraps nested Content API value shapes', () => {
        expect(
            extractMetadataStringByFieldKey(
                {
                    '999': {value: ['Nested description']},
                },
                '999',
            ),
        ).toBe('Nested description');
    });
});
