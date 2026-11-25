import {describe, expect, it} from 'vitest';
import {extractBooleanValue, siteMetadataToHeaderSettings, summarizeRawHeaderMetadata} from './siteMetadataToHeader.js';

describe('[siteMetadataToHeader]', () => {
    const metadata = {
        enableTranslation: {
            type: 'metadata_field_list',
            value: 'Yes',
        },
    };

    it('extracts header settings by field name', () => {
        expect(siteMetadataToHeaderSettings(metadata)).toEqual({
            enableTranslation: true,
        });
    });

    it('extracts header settings by field id', () => {
        const byId = {
            '307547': {value: 'No'},
        };

        expect(siteMetadataToHeaderSettings(byId)).toEqual({
            enableTranslation: false,
        });
    });

    it('defaults enableTranslation to true when missing', () => {
        expect(siteMetadataToHeaderSettings({})).toEqual({
            enableTranslation: true,
        });
    });

    it('summarizes raw header metadata fields for debug logging', () => {
        expect(
            summarizeRawHeaderMetadata({
                enableTranslation: {value: 'enabled'},
            }),
        ).toEqual({
            enableTranslation: {value: 'enabled'},
        });
    });

    it('coerces enabled/disabled select metadata values', () => {
        expect(
            siteMetadataToHeaderSettings({
                enableTranslation: {value: 'enabled'},
            }).enableTranslation,
        ).toBe(true);
        expect(
            siteMetadataToHeaderSettings({
                enableTranslation: {value: 'disabled'},
            }).enableTranslation,
        ).toBe(false);
    });

    it('coerces boolean metadata values', () => {
        expect(extractBooleanValue(true, true)).toBe(true);
        expect(extractBooleanValue('Yes', true)).toBe(true);
        expect(extractBooleanValue('0', true)).toBe(false);
        expect(extractBooleanValue(undefined, true)).toBe(true);
        expect(extractBooleanValue(undefined, false)).toBe(false);
    });

    it('unwraps Content API array-shaped metadata values (prod shape)', () => {
        expect(
            siteMetadataToHeaderSettings({
                enableTranslation: ['enabled'],
            }),
        ).toEqual({
            enableTranslation: true,
        });
    });

    it('unwraps nested { value: [...] } Content API metadata shapes', () => {
        expect(
            siteMetadataToHeaderSettings({
                enableTranslation: {value: ['disabled']},
            }),
        ).toEqual({
            enableTranslation: false,
        });
    });

    it('coerces array-shaped enableTranslation select values', () => {
        expect(extractBooleanValue(['enabled'], true)).toBe(true);
        expect(extractBooleanValue(['disabled'], true)).toBe(false);
        expect(extractBooleanValue({value: ['No']}, true)).toBe(false);
    });
});
