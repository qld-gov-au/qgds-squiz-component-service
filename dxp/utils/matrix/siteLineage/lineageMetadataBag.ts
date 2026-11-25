import type {SiteLineageAsset} from './types.js';

/** Normalize metadata from a Content API asset JSON payload. */
export function resolveLineageMetadataBag(raw: unknown, asset: SiteLineageAsset | null | undefined): Record<string, unknown> | null {
    const metadata = asset?.metadata && typeof asset.metadata === 'object' ? asset.metadata : null;

    if (metadata) {
        return metadata;
    }

    if (raw && typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        if (record.metadata && typeof record.metadata === 'object') {
            return record.metadata as Record<string, unknown>;
        }
        if (record.metadata_values && typeof record.metadata_values === 'object') {
            return record.metadata_values as Record<string, unknown>;
        }
    }

    return null;
}
