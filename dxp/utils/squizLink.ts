/**
 * SquizLink helpers shared by Edge components.
 *
 * `resolveSquizLink` runs in each `main` before sync render. The sync helpers
 * (`squizLinkHref`, `squizLinkLabel`, `hasSquizLinkContent`) then read the resolved link.
 *
 * Production-path-only port: local-dev Content API lookups are not included.
 * Matrix assets are resolved through `info.fns.resolveMatrixAssetById`.
 */

import type {ContentApiAsset} from '../types/matrix.ts';
import type {DxpComponentInfo} from '../types/dxp.ts';
import type {SquizLink} from '../types/squiz.ts';

export function squizLinkHref(link?: SquizLink | null, fallback = '#'): string {
    const url = link?.url?.trim();
    return url || fallback;
}

export function squizLinkLabel(link?: SquizLink | null, fallback = ''): string {
    const text = link?.text?.trim();
    return text || fallback;
}

export function squizLinkMatrixAssetId(link?: SquizLink | null): string {
    return String(link?.matrixAssetId ?? '').trim();
}

/** True when the SquizLink references a Matrix asset by id (picker mode). */
export function hasSquizMatrixAssetReference(link?: SquizLink | null): boolean {
    return Boolean(squizLinkMatrixAssetId(link));
}

/** True when the link has a non-empty url, text, or matrix asset id. */
export function hasSquizLinkContent(link?: SquizLink | null): boolean {
    if (!link) {
        return false;
    }
    return Boolean(link.url?.trim()) || Boolean(link.text?.trim()) || hasSquizMatrixAssetReference(link);
}

/** Unwrap a Content API asset and make sure it has a `url` (falls back to the first `web_paths` entry). */
function normalizeContentApiLineageAsset(raw: unknown): ContentApiAsset | null {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const wrapper = raw as {asset?: unknown};
    const asset = (wrapper.asset && typeof wrapper.asset === 'object' && !Array.isArray(wrapper.asset) ? wrapper.asset : raw) as ContentApiAsset;

    const id = String(asset.id ?? '').trim();
    if (!id) {
        return null;
    }

    const direct = typeof asset.url === 'string' ? asset.url.trim() : '';
    let resolvedUrl = direct;
    if (!resolvedUrl && Array.isArray(asset.web_paths)) {
        const preferred = asset.web_paths.find((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()));
        resolvedUrl = preferred ? preferred.trim() : '';
    }

    if (resolvedUrl && !asset.url) {
        return {...asset, url: resolvedUrl};
    }

    return asset;
}

export function squizLinkFieldsFromContentApiAsset(asset: ContentApiAsset | null | undefined): {url: string; text: string} {
    if (!asset) {
        return {url: '', text: ''};
    }
    const normalized = normalizeContentApiLineageAsset(asset);
    const source = normalized ?? asset;
    const url = source.url?.trim() ?? '';
    const text = source.name?.trim() || source.short_name?.trim() || '';
    return {url, text};
}

/**
 * Resolve author SquizLink for render: manual url/text, or Matrix asset via Edge `fns`.
 */
export async function resolveSquizLink<T extends SquizLink | null | undefined>(link: T, info?: DxpComponentInfo): Promise<T | SquizLink> {
    if (!link) {
        return link;
    }

    const manualUrl = link.url?.trim();
    if (manualUrl) {
        return {
            ...link,
            url: manualUrl,
            text: link.text?.trim() ?? '',
        };
    }

    const assetId = squizLinkMatrixAssetId(link);
    if (!assetId) {
        return link;
    }

    const resolveById = info?.fns?.resolveMatrixAssetById;
    if (typeof resolveById !== 'function') {
        return link;
    }

    const raw = await resolveById(assetId);
    if (raw === undefined) {
        return link;
    }

    const {url, text} = squizLinkFieldsFromContentApiAsset(raw);
    if (!url && !text) {
        return link;
    }

    return {
        ...link,
        url: url || link.url,
        text: link.text?.trim() || text,
    };
}

/**
 * `resolveSquizLink` for an optional field. Returns the input unchanged when it is empty.
 */
export async function resolveOptionalSquizLink<T extends SquizLink | null | undefined>(link: T, info?: DxpComponentInfo): Promise<T | SquizLink> {
    if (!link) {
        return link;
    }
    const resolved = await resolveSquizLink(link, info);
    return resolved ?? link;
}
