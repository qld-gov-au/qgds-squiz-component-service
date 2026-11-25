import {resolveLineageContentApiFetchImpl} from '../../../utils/matrix/contentApiLocalProxy/resolveLineageContentApiFetchImpl.js';
import {resolveContentApiUrlResolutionBase} from '../../../utils/matrix/pageUrl/index.js';
import {
    buildLineageLinkLookup,
    buildLineageMaps,
    enrichLineageAssetUrls,
    fetchLineageAssetById,
    fetchLineageAssetMetadataBag,
    extractMetadataStringByFieldKey,
    isMenuLinkedChild,
    isNavigableAsset,
    mergeLineagePayloads,
    resolveAssetName,
    resolveAssetNavigationUrl,
} from '../../../utils/matrix/siteLineage/index.js';
import {fetchSectionChildrenTree} from '../../../utils/matrix/siteLineage/fetchSiteLineage.js';
import type {DxpComponentInfo, NavigationCardItem, SiteLineagePayload} from '../../../utils/matrix/siteLineage/types.js';
import type {CardListingDisplay} from '../types.js';

export interface ResolveChildCardsOptions {
    display?: CardListingDisplay;
    /** Metadata key holding the description (`name-and-description` only). */
    descriptionMetadataFieldKey?: string;
    /** Overrides the Matrix fetch, for tests. */
    fetchImpl?: typeof fetch;
}

/** Use the AMAPI proxy when configured, otherwise a wrapped global fetch. */
function resolveFetch(info: DxpComponentInfo | undefined): typeof fetch {
    const proxy = resolveLineageContentApiFetchImpl(info);
    if (proxy) {
        return proxy;
    }
    // Never pass bare globalThis.fetch: Miniflare throws "Illegal invocation".
    return ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init)) as typeof fetch;
}

export function resolveChildCardsFromLineage(rootId: string, lineage: SiteLineagePayload): NavigationCardItem[] {
    const {childrenMap} = buildLineageMaps(lineage);
    const assetById = new Map((lineage.assets ?? []).map((asset) => [String(asset.id), asset]));
    const childIds = childrenMap.get(rootId) ?? [];
    const linkLookup = buildLineageLinkLookup(lineage.links);

    const items: NavigationCardItem[] = [];
    for (const childId of childIds) {
        if (!isMenuLinkedChild(childId, linkLookup, rootId)) continue;

        const asset = assetById.get(childId);
        if (!isNavigableAsset(asset)) continue;

        items.push({
            id: childId,
            title: resolveAssetName(asset),
            url: resolveAssetNavigationUrl(asset),
        });
    }

    return items;
}

/**
 * Direct, menu-visible, navigable child pages of `rootId`, in API order.
 * Returns [] when the lookup fails.
 */
export async function resolveChildCards(rootId: string, info: DxpComponentInfo | undefined, options: ResolveChildCardsOptions = {}): Promise<NavigationCardItem[]> {
    if (!rootId) {
        return [];
    }

    try {
        const fetchImpl = options.fetchImpl ?? resolveFetch(info);
        const urlResolutionBase = resolveContentApiUrlResolutionBase(info);

        let lineage: SiteLineagePayload = await fetchSectionChildrenTree(info, rootId, {fetchImpl, urlResolutionBase, maxDepth: 1});

        const hasRoot = (lineage.assets ?? []).some((asset) => String(asset?.id ?? '').trim() === rootId);
        if (!hasRoot) {
            const rootAsset = await fetchLineageAssetById(info, rootId, {
                fetchImpl,
                urlResolutionBase,
            });
            if (rootAsset) {
                lineage = mergeLineagePayloads({assets: [rootAsset], links: []}, lineage);
            }
        }

        lineage = enrichLineageAssetUrls(lineage, {
            siteRootId: rootId,
            urlResolutionBase: urlResolutionBase || undefined,
        });

        const items = resolveChildCardsFromLineage(rootId, lineage);
        const wantsDescription = options.display === 'name-and-description' && Boolean(options.descriptionMetadataFieldKey?.trim());

        if (!wantsDescription || items.length === 0) {
            return items;
        }

        const fieldKey = options.descriptionMetadataFieldKey!.trim();
        return await Promise.all(
            items.map(async (item) => {
                const description = await fetchDescription(info, item.id, fieldKey, fetchImpl, urlResolutionBase);
                return description ? {...item, description} : item;
            }),
        );
    } catch {
        return [];
    }
}

/** A failed metadata fetch leaves the description empty and keeps the card. */
async function fetchDescription(info: DxpComponentInfo | undefined, assetId: string, fieldKey: string, fetchImpl: typeof fetch, urlResolutionBase: string): Promise<string> {
    try {
        const metadata = await fetchLineageAssetMetadataBag(info, assetId, {
            fetchImpl,
            urlResolutionBase,
        });
        return extractMetadataStringByFieldKey(metadata, fieldKey);
    } catch {
        return '';
    }
}
