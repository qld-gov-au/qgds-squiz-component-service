/**
 * Minimal metadata helpers for header (and future footer) Edge components.
 * Field ids match Matrix metadata on site root 465.
 */

type MetadataBag = Record<string, unknown>;

/** Find a metadata entry by field name, then by field id (Content API / AMAPI). */
export function findMetadataField(metadata: MetadataBag | null | undefined, fieldName: string, fieldId: string): unknown {
    if (!metadata || typeof metadata !== 'object') return undefined;

    if (fieldName in metadata) {
        return metadata[fieldName];
    }

    if (fieldId in metadata) {
        return metadata[fieldId];
    }

    return Object.values(metadata).find((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        const record = entry as Record<string, unknown>;
        const id = String(record.fieldid ?? record.field_id ?? record.fieldId ?? record.metadata_field_id ?? record.metadataFieldId ?? '').trim();
        return fieldId && id === fieldId;
    });
}
