import {describe, expect, it} from 'vitest';
import {resolveLineageContentApiFetchImpl, shouldUseLocalHttpAmapiProxy} from './resolveLineageContentApiFetchImpl.js';

describe('shouldUseLocalHttpAmapiProxy', () => {
    it('returns true when disk cache and localhost MX_API are set', () => {
        expect(
            shouldUseLocalHttpAmapiProxy({
                env: {
                    AMAPI_DISK_CACHE: '1',
                    AMAPI_TOKEN: 'token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                    MX_API: 'http://localhost:4000/__api',
                },
            }),
        ).toBe(true);
    });

    it('returns false when disk cache is off', () => {
        expect(
            shouldUseLocalHttpAmapiProxy({
                env: {
                    AMAPI_TOKEN: 'token',
                    MX_API: 'http://localhost:4000/__api',
                },
            }),
        ).toBe(false);
    });
});

describe('resolveLineageContentApiFetchImpl', () => {
    it('returns a fetch wrapper for localhost disk proxy mode (not bare globalThis.fetch)', () => {
        const fetchImpl = resolveLineageContentApiFetchImpl({
            env: {
                AMAPI_DISK_CACHE: '1',
                AMAPI_TOKEN: 'token',
                BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                MX_API: 'http://localhost:4000/__api',
            },
        });
        expect(fetchImpl).not.toBe(globalThis.fetch);
        expect(typeof fetchImpl).toBe('function');
    });
});
