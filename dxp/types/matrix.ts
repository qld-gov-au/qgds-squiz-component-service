/**
 * Minimal Content API asset shape from Edge `fns` (e.g. resolveMatrixAssetById).
 * Squiz may return additional keys; this is the repo contract for link resolution.
 */
export interface ContentApiAsset {
    id?: string | number;
    type?: string;
    name?: string;
    short_name?: string;
    url?: string;
    web_paths?: unknown[];
}
