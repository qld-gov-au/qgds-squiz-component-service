import {describe, it, expect, afterEach} from 'vitest';
import {
    getBaseUrl,
    normalizePageUrl,
    resolveComponentEnv,
    resolveContentApiAuthHeaders,
    resolveContentApiBase,
    resolveContentApiUrlResolutionBase,
    resolveCtxAssetId,
    resolveCtxPageUrl,
    resolveMatrixServiceBase,
    resolveMxChildrenAssetsBaseUrl,
    siteBaseUrlFromPageUrl,
    LOCAL_DEV_MX_CHILDREN_ASSETS_BASE_URL,
} from './pageUrl.js';

describe('[normalizePageUrl]', () => {
    it('coerces String object values', () => {
        const boxed = new String('https://www.rfs.nsw.gov.au/homepage2/_nocache');
        expect(normalizePageUrl(boxed)).toBe('https://www.rfs.nsw.gov.au/homepage2/_nocache');
    });

    it('reads href from URL objects', () => {
        const url = new URL('https://www.rfs.nsw.gov.au/about');
        expect(normalizePageUrl(url)).toBe('https://www.rfs.nsw.gov.au/about');
    });
});

describe('[getBaseUrl]', () => {
    it('returns origin from a valid page URL', () => {
        expect(getBaseUrl('https://www.rfs.nsw.gov.au/about')).toBe('https://www.rfs.nsw.gov.au');
    });

    it('returns origin from _nocache page paths', () => {
        expect(getBaseUrl('https://www.rfs.nsw.gov.au/homepage2/_nocache')).toBe('https://www.rfs.nsw.gov.au');
    });

    it('returns origin from String object page URLs', () => {
        const boxed = new String('https://www.rfs.nsw.gov.au/homepage2/_nocache');
        expect(getBaseUrl(boxed)).toBe('https://www.rfs.nsw.gov.au');
    });

    it('falls back to local dev origin when URL is empty', () => {
        expect(getBaseUrl('')).toBe(LOCAL_DEV_MX_CHILDREN_ASSETS_BASE_URL);
    });

    it('falls back to local dev origin when URL is invalid', () => {
        expect(getBaseUrl('not-a-url')).toBe(LOCAL_DEV_MX_CHILDREN_ASSETS_BASE_URL);
    });
});

describe('[resolveCtxPageUrl]', () => {
    it('reads url from ctx when ctx is an object', () => {
        expect(
            resolveCtxPageUrl({
                ctx: {url: 'https://www.rfs.nsw.gov.au/homepage2/_nocache'},
            }),
        ).toBe('https://www.rfs.nsw.gov.au/homepage2/_nocache');
    });

    it('reads url when ctx is a string', () => {
        expect(
            resolveCtxPageUrl({
                ctx: 'https://www.rfs.nsw.gov.au/homepage2/_nocache',
            }),
        ).toBe('https://www.rfs.nsw.gov.au/homepage2/_nocache');
    });
});

describe('[resolveCtxAssetId]', () => {
    it('reads numeric placement asset IDs from ctx', () => {
        expect(resolveCtxAssetId({ctx: {assetId: 295283}})).toBe('295283');
    });

    it('prefers ctx.assetId over other fields', () => {
        expect(
            resolveCtxAssetId({
                ctx: {assetId: '123', parentAssetId: '456'},
            }),
        ).toBe('123');
    });
});

describe('[resolveContentApiBase]', () => {
    it('uses MX_API when configured', () => {
        expect(
            resolveContentApiBase({
                env: {MX_API: 'https://matrix.example/__api/'},
            }),
        ).toBe('https://matrix.example/__api');
    });

    it('derives Content API base from placement page URL', () => {
        expect(
            resolveContentApiBase({
                ctx: {
                    url: 'https://www.rfs.nsw.gov.au/fire-information/fires-near-me',
                },
                env: {},
            }),
        ).toBe('https://www.rfs.nsw.gov.au/__api');
    });
});

describe('[siteBaseUrlFromPageUrl]', () => {
    it('returns origin for production-style site URLs', () => {
        expect(siteBaseUrlFromPageUrl('https://www.rfs.nsw.gov.au/fire-information/fires-near-me')).toBe('https://www.rfs.nsw.gov.au');
    });

    it('includes site mount path for Matrix subdirectory sites', () => {
        expect(siteBaseUrlFromPageUrl('https://staging-web.matrix.squiz.cloud/site-mount/fire-information/content-page')).toBe('https://staging-web.matrix.squiz.cloud/site-mount');
    });
});

describe('[resolveContentApiUrlResolutionBase]', () => {
    it('prefers BASE_DOMAIN when configured', () => {
        expect(
            resolveContentApiUrlResolutionBase({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/site-mount',
                    MX_API: 'https://matrix.example/__api',
                },
            }),
        ).toBe('https://staging-web.matrix.squiz.cloud/site-mount');
    });

    it('appends default Matrix rebuild mount when BASE_DOMAIN is origin-only', () => {
        expect(
            resolveContentApiUrlResolutionBase({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/',
                    MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                },
            }),
        ).toBe('https://staging-web.matrix.squiz.cloud/site-mount');
    });

    it('strips /__api from MX_API env value', () => {
        expect(
            resolveContentApiUrlResolutionBase({
                env: {
                    MX_API: 'https://staging-web.matrix.squiz.cloud/site-mount/__api/',
                },
            }),
        ).toBe('https://staging-web.matrix.squiz.cloud/site-mount');
    });

    it('appends default Matrix rebuild mount when MX_API is instance root only', () => {
        const originalEnv = {...process.env};
        delete process.env.MX_API;
        delete process.env.BASE_DOMAIN;
        delete process.env.BASE_PATH;
        delete process.env.BEARER_AUTH;

        try {
            expect(
                resolveContentApiUrlResolutionBase({
                    env: {
                        MX_API: 'https://staging-web.matrix.squiz.cloud/__api',
                    },
                }),
            ).toBe('https://staging-web.matrix.squiz.cloud/site-mount');
        } finally {
            process.env = originalEnv;
        }
    });

    it('derives site base from page URL when MX_API is unset', () => {
        const originalEnv = {...process.env};
        delete process.env.MX_API;
        delete process.env.BASE_DOMAIN;
        delete process.env.BASE_PATH;
        delete process.env.BEARER_AUTH;

        try {
            expect(
                resolveContentApiUrlResolutionBase({
                    ctx: {
                        url: 'https://staging-web.matrix.squiz.cloud/site-mount/fire-information/content-page',
                    },
                    env: {},
                }),
            ).toBe('https://staging-web.matrix.squiz.cloud/site-mount');
        } finally {
            process.env = originalEnv;
        }
    });
});

describe('[resolveComponentEnv]', () => {
    const originalEnv = {...process.env};

    afterEach(() => {
        process.env = {...originalEnv};
    });

    it('derives MX_API from placement page URL when env is empty', () => {
        const originalEnv = {...process.env};
        delete process.env.MX_API;
        delete process.env.BASE_DOMAIN;
        delete process.env.BASE_PATH;
        delete process.env.BASE_URL;
        delete process.env.BEARER_AUTH;
        delete process.env.API_IDENTIFIER;

        try {
            const env = resolveComponentEnv({
                ctx: {
                    assetId: '295423',
                    url: 'https://staging-web.matrix.squiz.cloud/site-mount/alerts-and-restrictions/_nocache',
                },
                env: {},
            });

            expect(env.MX_API).toBe('https://staging-web.matrix.squiz.cloud/__api');
            expect(env.BASE_DOMAIN).toBe('');
            expect(env.BASE_PATH).toBe('');
        } finally {
            process.env = originalEnv;
        }
    });

    it('prefers explicit component-set env over derived page URL values', () => {
        const env = resolveComponentEnv({
            ctx: {
                url: 'https://staging-web.matrix.squiz.cloud/site-mount/alerts-and-restrictions',
            },
            env: {
                BASE_DOMAIN: 'https://www.rfs.nsw.gov.au',
                BASE_PATH: '/custom/mx',
                MX_API: 'https://www.rfs.nsw.gov.au/__api',
                BEARER_AUTH: 'secret',
            },
        });

        expect(env.BASE_DOMAIN).toBe('https://www.rfs.nsw.gov.au');
        expect(env.BASE_PATH).toBe('/custom/mx');
        expect(env.MX_API).toBe('https://www.rfs.nsw.gov.au/__api');
        expect(env.BEARER_AUTH).toBe('secret');
    });

    it('reads BEARER_AUTH from process.env when component-set env is partial', () => {
        const originalEnv = {...process.env};
        process.env.BEARER_AUTH = 'edge-bound-token';
        process.env.MX_API = 'https://staging-web.matrix.squiz.cloud/__api';

        try {
            const env = resolveComponentEnv({
                ctx: {assetId: '295423'},
                env: {
                    API_IDENTIFIER: 'RfsPublicWebsiteComponentServiceAPI',
                },
            });

            expect(env.BEARER_AUTH).toBe('edge-bound-token');
            expect(env.MX_API).toBe('https://staging-web.matrix.squiz.cloud/__api');
        } finally {
            process.env = originalEnv;
        }
    });

    it('does not derive Matrix service base from page URL alone', () => {
        expect(
            resolveMatrixServiceBase({
                ctx: {
                    url: 'https://staging-web.matrix.squiz.cloud/site-mount/alerts-and-restrictions',
                },
                env: {},
            }),
        ).toBe('');
    });
});

describe('[resolveContentApiAuthHeaders]', () => {
    it('strips Bearer prefix from BEARER_AUTH', () => {
        expect(
            resolveContentApiAuthHeaders({
                env: {BEARER_AUTH: 'Bearer secret-token'},
            }),
        ).toEqual({Authorization: 'Bearer secret-token'});
    });

    it('returns empty object when BEARER_AUTH is unset', () => {
        expect(resolveContentApiAuthHeaders({env: {}})).toEqual({});
    });
});

describe('[resolveMxChildrenAssetsBaseUrl]', () => {
    const originalBaseDomain = process.env.BASE_DOMAIN;
    const originalBaseUrl = process.env.BASE_URL;

    afterEach(() => {
        if (originalBaseDomain === undefined) {
            delete process.env.BASE_DOMAIN;
        } else {
            process.env.BASE_DOMAIN = originalBaseDomain;
        }
        if (originalBaseUrl === undefined) {
            delete process.env.BASE_URL;
        } else {
            process.env.BASE_URL = originalBaseUrl;
        }
    });

    it('uses BASE_DOMAIN when set', () => {
        process.env.BASE_DOMAIN = 'https://www.rfs.nsw.gov.au/';
        expect(resolveMxChildrenAssetsBaseUrl()).toBe('https://www.rfs.nsw.gov.au');
    });

    it('falls back to BASE_URL when BASE_DOMAIN is unset', () => {
        delete process.env.BASE_DOMAIN;
        process.env.BASE_URL = 'https://www.faculti.com.au';
        expect(resolveMxChildrenAssetsBaseUrl()).toBe('https://www.faculti.com.au');
    });

    it('falls back to local dev origin when neither env var is set', () => {
        delete process.env.BASE_DOMAIN;
        delete process.env.BASE_URL;
        expect(resolveMxChildrenAssetsBaseUrl()).toBe(LOCAL_DEV_MX_CHILDREN_ASSETS_BASE_URL);
    });

    it('prefers ctx page URL origin over BASE_DOMAIN', () => {
        process.env.BASE_DOMAIN = 'https://www.faculti.com.au';
        expect(resolveMxChildrenAssetsBaseUrl('https://www.rfs.nsw.gov.au/homepage2/_nocache')).toBe('https://www.rfs.nsw.gov.au');
    });

    it('prefers String object ctx page URL over BASE_DOMAIN', () => {
        process.env.BASE_DOMAIN = 'https://tgh1-web.matrix.squiz.cloud';
        const boxed = new String('https://www.rfs.nsw.gov.au/homepage2/_nocache');
        expect(resolveMxChildrenAssetsBaseUrl(boxed)).toBe('https://www.rfs.nsw.gov.au');
    });
});
