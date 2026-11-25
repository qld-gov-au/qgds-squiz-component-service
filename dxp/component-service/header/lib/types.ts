import type {SquizImage, SquizLink} from '../../../types/squiz';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types';
import type {NavbarMetadata, NavbarNavigationItem} from './navbarTypes';

export interface HeaderPreHeaderActionDropdown {
    type?: string;
    /** Toggle label when `type` is `list`, `html`, or `form`. */
    text?: string;
    /** Plain link action icon suffix when `type` is `none`. */
    icon?: string;
    /** Plain pre-header link when `type` is `none` (manifest field path). */
    link?: SquizLink;
    HTMLContent?: string;
    viewMore?: SquizLink;
    items?: SquizLink[];
}

export interface HeaderPreHeaderAction {
    /** Dropdown toggle label when `dropdown` is set. */
    text?: string;
    dropdown?: HeaderPreHeaderActionDropdown;
}

export interface HeaderPreHeader {
    globalLink?: SquizLink;
    actions?: HeaderPreHeaderAction[];
}

export type SecondaryLockupType = 'text' | 'image';

export interface HeaderMainContent {
    palette?: 'dark' | 'default' | 'dark-alt';
    url?: SquizLink;
    /** Sub-brand only: text (site title) or image (secondary logo). */
    secondaryLockupType?: SecondaryLockupType;
    logo?: SquizImage | null;
    secondaryLogo?: SquizImage | null;
    siteTitle?: string;
    subline?: string;
}

export interface HeaderSiteSearch {
    enabled?: 'show' | 'hide';
    placeholder?: string;
    label?: string;
    searchResultsUrl?: string;
    autosuggestUrl?: string;
    collection?: string;
    profile?: string;
    numRanks?: string;
    tiers?: 'off' | 'on';
}

export interface HeaderAssets {
    siteSearch?: HeaderSiteSearch;
}

export type BrandLayout = 'masterBrand' | 'subBrand' | 'coBrand' | 'endorsedBrand' | 'standaloneBrand';

export type NavigationLayout = 'simpleList' | 'megaMenu';

/** Manifest `navigation` — lineage primary nav layout and metadata field. */
export interface HeaderNavigationConfig {
    layout?: NavigationLayout;
    /**
     * metadata_values key on child page assets (e.g. `page-lead`).
     * From AMAPI/Content API on the page asset, not a metadata-field asset id.
     */
    descriptionMetadataFieldKey?: string;
    /** @internal Legacy manifest key; use descriptionMetadataFieldKey. */
    descriptionMetadataFieldAssetId?: string;
}

export interface HeaderInput {
    brandLayout?: BrandLayout;
    /** Lineage nav layout and metadata field (manifest). */
    navigation?: HeaderNavigationConfig;
    /** Preview / Vitest fixtures only — nav tree; not in manifest schema. */
    previewNavigation?: NavbarNavigationItem[];
    /** Preview / Vitest fixtures only — pairs with `previewNavigation`. */
    navbarMetadata?: NavbarMetadata;
    /** Matrix site root asset ID for primary nav lineage (overrides component-set env). */
    siteRootAssetId?: string;
    hasDeliveringForQLDLogo?: boolean;
    preHeader?: HeaderPreHeader;
    mainContent?: HeaderMainContent;
    assets?: HeaderAssets;
    componentAdvancedOptions?: {
        id?: string;
        classes?: string;
    };
}

export interface RenderHeaderBannerOptions {
    input: HeaderInput;
    editMode?: boolean;
    info?: DxpComponentInfo;
}

export interface RenderPrimaryNavbarOptions {
    navigation?: NavbarNavigationItem[];
    metadata?: NavbarMetadata;
    editMode?: boolean;
    /** Overrides default `main-nav` when set in manifest advanced options. */
    navigationId?: string;
}
