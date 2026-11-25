import {findMetadataField} from './siteMetadataToFooter.js';

type MetadataBag = Record<string, unknown>;

/**
 * Unwrap Content API metadata field shapes to a scalar.
 * Values may be bare scalars, `{ value }`, arrays (`["…"]`), or `{ value: ["…"] }`.
 */
export function unwrapMetadataScalar(field: unknown): unknown {
    if (field == null) return undefined;

    if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
        return field;
    }

    if (Array.isArray(field)) {
        for (const entry of field) {
            const unwrapped = unwrapMetadataScalar(entry);
            if (unwrapped != null && unwrapped !== '') return unwrapped;
        }
        return undefined;
    }

    if (typeof field === 'object' && 'value' in field) {
        return unwrapMetadataScalar((field as {value?: unknown}).value);
    }

    return undefined;
}

/**
 * Read a trimmed string from a page asset metadata bag.
 * `fieldKey` is the metadata_values / Content API metadata key on the page asset
 * (e.g. Arts `page-lead`), not a separate metadata-field asset id.
 */
export function extractMetadataStringByFieldKey(metadata: MetadataBag | null | undefined, fieldKey: string): string {
    const key = fieldKey.trim();
    if (!key || !metadata) {
        return '';
    }

    const raw = findMetadataField(metadata, key, key) ?? findMetadataField(metadata, '', key);
    const scalar = unwrapMetadataScalar(raw);
    if (scalar == null || scalar === '') {
        return '';
    }

    return String(scalar).trim();
}
