import type {SiteLineageAsset, SiteLineageLink, SiteLineagePayload} from '../siteLineage/types.js';

export interface ContentApiAmapiProxyConfig {
    matrixOrigin: string;
    token: string;
    fetchImpl?: typeof fetch;
    /** Local AMAPI preview cache TTL in ms; `0` disables in-memory cache. */
    cacheTtlMs?: number;
}

export interface AmapiFetch {
    (path: string, init?: RequestInit): Promise<Response>;
}

export interface HandleContentApiAmapiRequestOptions {
    amapiFetch: AmapiFetch;
}

export interface RawAmapiAsset {
    id?: string | number;
    type?: string;
    type_name?: string;
    name?: string;
    short_name?: string;
    url?: string;
    urls?: unknown[];
    web_paths?: unknown;
    status?: {code?: string; id?: number; name?: string};
    attributes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    metadata_values?: Record<string, unknown>;
}

export interface RawAmapiLink {
    link_id?: string | number;
    id?: string | number;
    major_id?: string | number;
    minor_id?: string | number;
    parent_asset_id?: string | number;
    child_asset_id?: string | number;
    link_type?: string | number | null;
    /** Numeric Matrix link type when `link_type` is absent (1 menu, 2 hidden, 4 Type 3, 8 notice). */
    type?: string | number | null;
    sort_order?: number;
    value?: string;
}

export type {SiteLineageAsset, SiteLineageLink, SiteLineagePayload};
