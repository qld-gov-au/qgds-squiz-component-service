import {afterEach, describe, expect, it, vi} from 'vitest';
import {resolveAmapiConfigFromInfo, resolveAmapiProxyConfig, resolveLocalAmapiConfig, shouldUseLocalAmapiProxy} from './resolveLocalAmapiConfig.js';

describe('shouldUseLocalAmapiProxy', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns false when dev-ui has fns but no AMAPI on component env', () => {
        vi.stubEnv('AMAPI_TOKEN', 'dev-token');
        vi.stubEnv('BASE_DOMAIN', 'https://www.arts.qld.gov.au');

        expect(
            shouldUseLocalAmapiProxy({
                fns: {
                    resolveUri: () => '',
                    resolveMatrixAssetById: async () => null,
                },
                ctx: {assetId: '', url: ''},
            }),
        ).toBe(false);
    });

    it('returns true when dev-ui has fns and AMAPI on component env', () => {
        expect(
            shouldUseLocalAmapiProxy({
                fns: {
                    resolveUri: () => '',
                    resolveMatrixAssetById: async () => null,
                },
                env: {
                    AMAPI_TOKEN: 'dev-token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                },
            }),
        ).toBe(true);
    });

    it('returns false on Edge runtime even without AMAPI env', () => {
        expect(
            shouldUseLocalAmapiProxy({
                fns: {resolveUri: () => ''},
            }),
        ).toBe(false);
    });
});

describe('resolveAmapiConfigFromInfo', () => {
    it('reads AMAPI token and matrix origin from component env', () => {
        const config = resolveAmapiConfigFromInfo({
            env: {
                AMAPI_TOKEN: 'dev-token',
                BASE_DOMAIN: 'https://www.arts.qld.gov.au',
            },
        });
        expect(config?.token).toBe('dev-token');
        expect(config?.matrixOrigin).toBe('https://www.arts.qld.gov.au');
    });

    it('derives matrix origin from BASE_URL when BASE_DOMAIN is empty', () => {
        const config = resolveAmapiConfigFromInfo({
            env: {
                AMAPI_TOKEN: 'dev-token',
                BASE_URL: 'https://www.arts.qld.gov.au/site',
            },
        });
        expect(config?.matrixOrigin).toBe('https://www.arts.qld.gov.au');
    });
});

describe('resolveLocalAmapiConfig', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('derives matrix origin from BASE_URL when BASE_DOMAIN is unset', () => {
        vi.stubEnv('AMAPI_TOKEN', 'dev-token');
        vi.stubEnv('BASE_URL', 'https://www.arts.qld.gov.au/site');
        vi.stubEnv('BASE_DOMAIN', '');

        const config = resolveLocalAmapiConfig();
        expect(config?.token).toBe('dev-token');
        expect(config?.matrixOrigin).toBe('https://www.arts.qld.gov.au');
    });
});

describe('resolveAmapiProxyConfig', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('prefers component env over process.env when dev-ui passes fns', () => {
        vi.stubEnv('AMAPI_TOKEN', 'process-token');
        vi.stubEnv('BASE_DOMAIN', 'https://ignored.example');

        const config = resolveAmapiProxyConfig({
            fns: {resolveUri: () => ''},
            env: {
                AMAPI_TOKEN: 'info-token',
                BASE_DOMAIN: 'https://www.arts.qld.gov.au',
            },
        });

        expect(config?.token).toBe('info-token');
        expect(config?.matrixOrigin).toBe('https://www.arts.qld.gov.au');
    });
});
