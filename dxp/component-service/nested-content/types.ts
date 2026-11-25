/** Manifest input for the `main` function (see `manifest.json`). */
export interface NestedContentInput {
    matrixAsset?: string;
}

/** Subset of Edge `info` used by `main`. */
export interface NestedContentInfo {
    ctx?: {url?: URL | string} | string;
    fns?: {
        resolveUri?: (uri: string) => Promise<{url?: string} | undefined>;
    };
}
