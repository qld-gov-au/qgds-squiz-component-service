import {resolveCtxAssetId} from '../../../utils/matrix/pageUrl/index.js';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types.js';
import type {CardListingListing} from '../types.js';

/** Parses `matrix-asset://<identifier>/<assetId>` and returns the asset id. */
const MATRIX_ASSET_URI_PATTERN = /^matrix-asset:\/\/[^/]+\/(\d+)$/;

/**
 * Resolve the asset id whose child pages are listed.
 *
 * `current` uses the page the component sits on (`ctx.assetId`). `custom`
 * reads the asset id from the `rootNode` URI. Anything else returns "".
 */
export function resolveListingRootId(listing: CardListingListing | undefined, info: DxpComponentInfo | undefined): string {
    if (listing?.source === 'custom') {
        const match = MATRIX_ASSET_URI_PATTERN.exec(String(listing.rootNode ?? '').trim());
        return match ? match[1] : '';
    }

    return resolveCtxAssetId(info);
}
