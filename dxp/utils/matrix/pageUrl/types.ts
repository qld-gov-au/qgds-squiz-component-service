export interface PageUrlComponentCtx {
    assetId?: string | number;
    parentAssetId?: string | number;
    pageAssetId?: string | number;
    url?: string;
    href?: string;
    canonicalUrl?: string;
    pageUrl?: string;
}

export interface PageUrlComponentInfo {
    ctx?: PageUrlComponentCtx;
    env?: Record<string, string>;
    set?: {
        environment?: Record<string, string>;
        env?: Record<string, string>;
    };
    environment?: Record<string, string>;
    assetId?: string | number;
    url?: string;
}

export interface ResolvedComponentEnv {
    API_IDENTIFIER: string;
    BASE_DOMAIN: string;
    BASE_PATH: string;
    API_SITE_LINEAGE_PATH: string;
    /** Comma-separated extra homepage paths (normalized); `/` is always treated as home. */
    API_HOME_PATHS: string;
    MX_API: string;
    BEARER_AUTH: string;
}
