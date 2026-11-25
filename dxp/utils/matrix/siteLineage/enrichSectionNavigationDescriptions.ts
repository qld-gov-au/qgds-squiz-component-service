import {resolveContentApiUrlResolutionBase} from '../pageUrl/index.js';
import {fetchLineageAssetMetadataBag} from './fetchLineageAssetMetadata.js';
import {extractMetadataStringByFieldKey} from './metadataFieldValue.js';
import {SITE_LINEAGE_LOG_LABELS, siteLineageLog} from './siteLineageLog.js';
import type {DxpComponentInfo, SectionNavigationItem} from './types.js';

export interface EnrichSectionNavigationDescriptionsOptions {
    /** metadata_values key on each child page asset (e.g. `page-lead`). */
    metadataFieldKey: string;
    info?: DxpComponentInfo;
    fetchImpl: typeof fetch;
    logLabel?: string;
}

/** Attach child `description` from metadata for mega menu (metadata only; no body fallback). */
export async function enrichSectionNavigationChildDescriptions(
    items: SectionNavigationItem[],
    options: EnrichSectionNavigationDescriptionsOptions,
): Promise<SectionNavigationItem[]> {
    const fieldKey = options.metadataFieldKey.trim();
    if (!fieldKey || !Array.isArray(items) || items.length === 0) {
        return items;
    }

    const childIds = new Set<string>();
    for (const hub of items) {
        for (const child of hub.children ?? []) {
            const id = String(child.id ?? '').trim();
            if (id) {
                childIds.add(id);
            }
        }
    }

    if (childIds.size === 0) {
        return items;
    }

    const urlResolutionBase = resolveContentApiUrlResolutionBase(options.info);
    const descriptionByAssetId = new Map<string, string>();

    await Promise.all(
        [...childIds].map(async (assetId) => {
            const metadata = await fetchLineageAssetMetadataBag(options.info, assetId, {
                fetchImpl: options.fetchImpl,
                urlResolutionBase,
                logLabel: options.logLabel ?? SITE_LINEAGE_LOG_LABELS.headerNav,
            });
            const text = extractMetadataStringByFieldKey(metadata, fieldKey);
            if (text) {
                descriptionByAssetId.set(assetId, text);
            } else if (metadata && Object.keys(metadata).length > 0) {
                siteLineageLog(options.logLabel ?? SITE_LINEAGE_LOG_LABELS.headerNav, 'asset metadata field key not found on page asset', {
                    assetId,
                    fieldKey,
                    metadataKeys: Object.keys(metadata).slice(0, 25),
                });
            } else {
                siteLineageLog(options.logLabel ?? SITE_LINEAGE_LOG_LABELS.headerNav, 'asset metadata bag empty after fetch', {assetId, fieldKey});
            }
        }),
    );

    return items.map((hub) => {
        if (!hub.children?.length) {
            return hub;
        }

        return {
            ...hub,
            children: hub.children.map((child) => {
                const id = String(child.id ?? '').trim();
                const description = id ? (descriptionByAssetId.get(id) ?? child.description ?? '') : (child.description ?? '');
                return description ? {...child, description} : {...child};
            }),
        };
    });
}
