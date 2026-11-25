import type {ContentApiAsset} from './matrix.ts';

/**
 * Shared types for the second argument to Edge `main(input, componentUtilities)`.
 * Matrix may add page URL fields on `ctx` — see `PageUrlComponentCtx` in matrix utils.
 */
export interface DxpComponentCtx {
    editor?: boolean;
    assetId?: string | number;
    /** Legacy Edge detection; prefer `fns.resolveUri`. */
    resolveUri?: (uri: string) => string | Promise<ContentApiAsset>;
}

export interface DxpComponentFns {
    resolveMatrixAssetById?(assetId: string, attributes?: string[]): Promise<ContentApiAsset>;
    resolveMatrixAssetByUrl?(url: string, attributes?: string[]): Promise<ContentApiAsset>;
    /** matrix-asset-uri fields; not used for SquizLink `matrixAssetId` resolution. */
    resolveUri?(uri: string): Promise<ContentApiAsset>;
}

export interface DxpComponentInfo {
    env?: Record<string, string>;
    ctx?: DxpComponentCtx | string;
    fns?: DxpComponentFns;
}
