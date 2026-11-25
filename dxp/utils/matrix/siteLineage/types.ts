import type {DxpComponentCtx as SharedDxpComponentCtx, DxpComponentFns} from '../../../types/dxp.js';
import type {ContentApiAsset} from '../../../types/matrix.js';
import type {PageUrlComponentCtx, PageUrlComponentInfo} from '../pageUrl/types.js';

/** Lineage-aware `ctx` (page URL fields plus shared DXP context). */
export interface DxpComponentCtx extends PageUrlComponentCtx, SharedDxpComponentCtx {}

/** Lineage-aware `componentUtilities` (page URL env plus shared DXP info). */
export interface DxpComponentInfo {
    ctx?: DxpComponentCtx;
    env?: Record<string, string>;
    fns?: DxpComponentFns;
    set?: {
        environment?: Record<string, string>;
        env?: Record<string, string>;
    };
    environment?: Record<string, string>;
    assetId?: string | number;
    url?: string;
}

export interface SiteLineageLink {
    parent_asset_id?: string | number;
    child_asset_id?: string | number;
    link_type?: string | number | null;
    /**
     * Real Content API shape: Matrix link type as a number (1 = Type 1 / menu,
     * 2 = Type 2 / hidden, 4 = Type 3, 8 = notice). `link_type` is absent.
     */
    type?: string | number | null;
}

export interface SiteLineageAsset extends ContentApiAsset {
    urls?: unknown[];
    status?: {code?: string};
    attributes?: Record<string, unknown>;
    /** Content API metadata bag (e.g. SEO description field). */
    metadata?: Record<string, unknown>;
}

export interface SiteLineagePayload {
    links?: SiteLineageLink[];
    assets?: SiteLineageAsset[];
}

export interface SectionNavigationItem {
    id: string;
    title: string;
    url: string;
    shortName?: string;
    assetType?: string;
    /** Mega menu child blurb from Content API metadata (lineage enrichment). */
    description?: string;
    children?: SectionNavigationItem[];
}

export interface NavigationCardItem {
    id: string;
    title: string;
    url: string;
    description?: string;
}

export interface BreadcrumbItem {
    title: string;
    url: string;
}

export interface LineageContext {
    assetId?: string;
    pageUrl?: string;
    urlResolutionBase?: string;
    /** When set, paths that suppress the breadcrumb trail (always includes `/` when from env). */
    homepagePaths?: ReadonlySet<string>;
    /**
     * Section nav only: treat a link with no type as visible. Default `false`
     * keeps the menu policy (untyped links hidden) for header and breadcrumbs.
     */
    untypedLinksVisible?: boolean;
}

export interface ResolveRelatedNavigationOptions {
    overrideNavigation?: unknown;
    previewItems?: SectionNavigationItem[];
    fetchImpl?: typeof fetch;
}

export interface ResolvePageChildrenNavigationOptions {
    overrideCards?: unknown;
    previewItems?: NavigationCardItem[];
    fetchImpl?: typeof fetch;
}

export interface ResolveBreadcrumbsOptions {
    previewItems?: BreadcrumbItem[];
    fetchImpl?: typeof fetch;
}

export interface PlacementAsset {
    name: string;
    publishedDate: string | null;
}

export interface ResolvePlacementAssetOptions {
    previewAsset?: PlacementAsset | null;
    fetchImpl?: typeof fetch;
}

export interface ResolveSiteHeaderNavigationOptions {
    overrideNavigation?: unknown;
    previewItems?: SectionNavigationItem[];
    fetchImpl?: typeof fetch;
    maxDepth?: number;
    /** Matrix site root asset id (header author field); beats env. */
    siteRootAssetId?: string;
}

export interface FetchSiteLineageOptions {
    fetchImpl?: typeof fetch;
    expandSectionChildren?: boolean;
}
