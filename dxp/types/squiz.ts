/** Matrix manifest field `type: SquizLink`. */
export interface SquizLink {
    text?: string;
    url?: string;
    target?: string;
    /** Set when author picks an internal asset (Matrix asset picker). */
    matrixAssetId?: string;
    /** Editor metadata; not used for Content API fetch (use `matrixAssetId`). */
    matrixIdentifier?: string;
    matrixDomain?: string;
}

export interface SquizImageVariation {
    url?: string;
    width?: number;
    height?: number;
    byteSize?: number;
    mimeType?: string;
    aspectRatio?: string;
    sha1Hash?: string;
}

/** Matrix manifest field `type: SquizImage`. */
export interface SquizImage {
    name?: string;
    alt?: string;
    caption?: string;
    imageVariations?: {
        original?: SquizImageVariation;
    };
}
