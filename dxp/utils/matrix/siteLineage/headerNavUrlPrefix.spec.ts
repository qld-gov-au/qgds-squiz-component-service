import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    applyHeaderNavUrlPrefix,
    isLocalCutUpEnv,
    prependHeaderNavUrlPrefix,
    resolveHeaderHomeUrl,
    resolveHeaderNavUrlPrefix,
    resolveMatrixDevHeaderNavUrlPrefix,
} from './headerNavUrlPrefix.js';

function stubNonLocalCutUpEnv(): void {
    vi.stubEnv('IS_LOCAL', 'false');
    vi.stubEnv('VITE_AMAPI_TOKEN', '');
    vi.stubEnv('AMAPI_TOKEN', '');
    vi.stubEnv('ASSET_MANAGEMENT_BEARER_TOKEN', '');
    vi.stubEnv('MX_API', '');
}

describe('isLocalCutUpEnv', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns true when IS_LOCAL is set in process.env', () => {
        stubNonLocalCutUpEnv();
        vi.stubEnv('IS_LOCAL', 'true');
        expect(isLocalCutUpEnv()).toBe(true);
    });

    it('returns false when IS_LOCAL is only set on component env', () => {
        stubNonLocalCutUpEnv();
        expect(isLocalCutUpEnv({env: {IS_LOCAL: 'true'}})).toBe(false);
    });

    it('returns false when IS_LOCAL is unset', () => {
        stubNonLocalCutUpEnv();
        expect(isLocalCutUpEnv()).toBe(false);
    });

    it('returns true when MX_API points at the local boilerplate server', () => {
        expect(isLocalCutUpEnv({env: {MX_API: 'http://localhost:4000/__api'}})).toBe(true);
    });

    it('returns true when local AMAPI Content API proxy is configured', () => {
        vi.stubEnv('AMAPI_TOKEN', 'test-token');
        vi.stubEnv('BASE_URL', 'https://staging-web.matrix.squiz.cloud');

        expect(isLocalCutUpEnv()).toBe(true);
    });
});

describe('resolveMatrixDevHeaderNavUrlPrefix', () => {
    it('returns mount path for Matrix rebuild dev BASE_DOMAIN', () => {
        expect(resolveMatrixDevHeaderNavUrlPrefix('https://staging-web.matrix.squiz.cloud/site-mount')).toBe('/site-mount');
    });

    it('defaults to rebuild mount when BASE_DOMAIN is origin-only', () => {
        expect(resolveMatrixDevHeaderNavUrlPrefix('https://staging-web.matrix.squiz.cloud')).toBe('/site-mount');
    });

    it('returns null for production BASE_DOMAIN', () => {
        expect(resolveMatrixDevHeaderNavUrlPrefix('https://www.rfs.nsw.gov.au')).toBeNull();
    });

    it('returns null when BASE_DOMAIN is empty', () => {
        expect(resolveMatrixDevHeaderNavUrlPrefix('')).toBeNull();
    });
});

describe('resolveHeaderNavUrlPrefix', () => {
    beforeEach(() => {
        stubNonLocalCutUpEnv();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('uses default rebuild mount when BASE_DOMAIN is origin-only on Matrix dev', () => {
        expect(
            resolveHeaderNavUrlPrefix({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud',
                },
            }),
        ).toBe('/site-mount');
    });

    it('derives mount path from page URL when BASE_DOMAIN is unset', () => {
        expect(
            resolveHeaderNavUrlPrefix({
                ctx: {
                    url: 'https://staging-web.matrix.squiz.cloud/site-mount/alerts-and-restrictions',
                },
            }),
        ).toBe('/site-mount');
    });

    it('returns null on production', () => {
        expect(
            resolveHeaderNavUrlPrefix({
                env: {BASE_DOMAIN: 'https://www.rfs.nsw.gov.au'},
            }),
        ).toBeNull();
    });

    it('returns null when IS_LOCAL is true even with Matrix rebuild BASE_DOMAIN', () => {
        vi.stubEnv('IS_LOCAL', 'true');

        expect(
            resolveHeaderNavUrlPrefix({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/site-mount',
                },
                ctx: {
                    url: 'https://staging-web.matrix.squiz.cloud/site-mount/alerts-and-restrictions',
                },
            }),
        ).toBeNull();
    });
});

describe('resolveHeaderHomeUrl', () => {
    beforeEach(() => {
        stubNonLocalCutUpEnv();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns rebuild mount path on Matrix dev when BASE_DOMAIN is origin-only', () => {
        expect(
            resolveHeaderHomeUrl({
                env: {BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud'},
            }),
        ).toBe('/site-mount');
    });

    it('returns rebuild mount path when BASE_DOMAIN already includes the mount', () => {
        expect(
            resolveHeaderHomeUrl({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/site-mount',
                },
            }),
        ).toBe('/site-mount');
    });

    it('returns / on production', () => {
        expect(
            resolveHeaderHomeUrl({
                env: {BASE_DOMAIN: 'https://www.rfs.nsw.gov.au'},
            }),
        ).toBe('/');
    });

    it('returns / when IS_LOCAL is true even with Matrix rebuild BASE_DOMAIN', () => {
        vi.stubEnv('IS_LOCAL', 'true');

        expect(
            resolveHeaderHomeUrl({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/site-mount',
                },
                ctx: {
                    url: 'https://staging-web.matrix.squiz.cloud/site-mount/alerts-and-restrictions',
                },
            }),
        ).toBe('/');
    });

    it('returns / when local AMAPI Content API proxy is configured', () => {
        vi.stubEnv('AMAPI_TOKEN', 'test-token');
        vi.stubEnv('BASE_URL', 'https://staging-web.matrix.squiz.cloud');

        expect(
            resolveHeaderHomeUrl({
                env: {
                    BASE_DOMAIN: 'https://staging-web.matrix.squiz.cloud/site-mount',
                },
            }),
        ).toBe('/');
    });
});

describe('prependHeaderNavUrlPrefix', () => {
    const prefix = '/site-mount';

    it('prepends mount path to relative nav URLs', () => {
        expect(prependHeaderNavUrlPrefix('/alerts-and-restrictions', prefix)).toBe('/site-mount/alerts-and-restrictions');
    });

    it('leaves URLs unchanged when mount path is already present', () => {
        expect(prependHeaderNavUrlPrefix('/site-mount/alerts-and-restrictions', prefix)).toBe('/site-mount/alerts-and-restrictions');
    });
});

describe('applyHeaderNavUrlPrefix', () => {
    it('prepends mount path to hub and child URLs on Matrix rebuild dev', () => {
        const prefixed = applyHeaderNavUrlPrefix(
            [
                {
                    id: 'hub',
                    title: 'Alerts and Restrictions',
                    url: '/alerts-and-restrictions',
                    children: [
                        {
                            id: 'child',
                            title: 'Fires Near Me',
                            url: '/alerts-and-restrictions/fires-near-me',
                        },
                    ],
                },
            ],
            '/site-mount',
        );

        expect(prefixed[0].url).toBe('/site-mount/alerts-and-restrictions');
        expect(prefixed[0].children?.[0].url).toBe('/site-mount/alerts-and-restrictions/fires-near-me');
    });

    it('returns items unchanged when prefix is null', () => {
        const items = [
            {
                id: 'hub',
                title: 'Alerts and Restrictions',
                url: '/alerts-and-restrictions',
            },
        ];

        expect(applyHeaderNavUrlPrefix(items, null)).toEqual(items);
    });
});
