export type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type ColumnCount = '1' | '2' | '3';
export type CardListingSource = 'current' | 'custom';
export type CardListingDisplay = 'name' | 'name-and-description';

export interface CardListingIntro {
    headingTag?: HeadingTag;
    title?: string;
}

/** Where the listed child pages come from. */
export interface CardListingListing {
    source?: CardListingSource;
    /** Matrix asset URI (`matrix-asset://<identifier>/<assetId>`), used when source is `custom`. */
    rootNode?: string;
}

export interface CardListingSettings {
    columns?: ColumnCount;
    variant?: string;
    display?: CardListingDisplay;
    /** Metadata key on each child page holding the description (`name-and-description` only). */
    descriptionMetadataFieldKey?: string;
    isEqualHeight?: boolean;
}

export interface CardListingInput {
    intro?: CardListingIntro;
    listing?: CardListingListing;
    settings?: CardListingSettings;
}
