/**
 * Pure transforms from site-root metadata → header props shapes.
 * Field names and ids match Matrix metadata sections on site root 465.
 */

import {findMetadataField} from './siteMetadataToFooter.js';
import {unwrapMetadataScalar} from './metadataFieldValue.js';

export const HEADER_METADATA_FIELD_IDS = {
    enableTranslation: '307547',
} as const;

export type SiteHeaderSettings = {
    enableTranslation: boolean;
};

type MetadataBag = Record<string, unknown>;

/** Coerce Matrix list/boolean metadata values to a boolean. */
export function extractBooleanValue(field: unknown, defaultValue: boolean): boolean {
    const value = unwrapMetadataScalar(field);
    if (value == null || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', 'yes', '1', 'on', 'enabled'].includes(normalized)) return true;
        if (['false', 'no', '0', 'off', 'disabled'].includes(normalized)) return false;
    }
    return defaultValue;
}

/** Build header settings from site-root metadata. */
export function siteMetadataToHeaderSettings(metadata: MetadataBag | null | undefined): SiteHeaderSettings {
    const enableTranslation = extractBooleanValue(findMetadataField(metadata, 'enableTranslation', HEADER_METADATA_FIELD_IDS.enableTranslation), true);

    return {
        enableTranslation,
    };
}

/** Raw header metadata field values for DXP debug logging. */
export function summarizeRawHeaderMetadata(metadata: MetadataBag | null | undefined): Record<string, unknown> {
    return {
        enableTranslation: findMetadataField(metadata, 'enableTranslation', HEADER_METADATA_FIELD_IDS.enableTranslation),
    };
}
