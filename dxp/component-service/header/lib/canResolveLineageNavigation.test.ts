import {describe, expect, it} from 'vitest';
import {canResolveLineageNavigation} from './canResolveLineageNavigation';

describe('canResolveLineageNavigation', () => {
    it('returns false when Matrix env is missing', () => {
        expect(canResolveLineageNavigation({env: {}})).toBe(false);
    });

    it('returns false for localhost boilerplate MX_API even with bearer', () => {
        expect(
            canResolveLineageNavigation({
                env: {
                    API_IDENTIFIER: 'id',
                    BASE_DOMAIN: 'https://example.com',
                    BASE_PATH: '/site',
                    MX_API: 'http://localhost:4000/__api',
                    BEARER_AUTH: 'token',
                },
            }),
        ).toBe(false);
    });

    it('returns true for absolute MX_API and bearer', () => {
        expect(
            canResolveLineageNavigation({
                env: {
                    API_IDENTIFIER: 'id',
                    BASE_DOMAIN: 'https://example.com',
                    BASE_PATH: '/site',
                    MX_API: 'https://www.arts.qld.gov.au/__api',
                    BEARER_AUTH: 'token',
                },
            }),
        ).toBe(true);
    });

    it('returns true when AMAPI token and BASE_DOMAIN are on component env', () => {
        expect(
            canResolveLineageNavigation({
                env: {
                    AMAPI_TOKEN: 'amapi-token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                    MX_API: 'http://localhost:4000/__api',
                },
            }),
        ).toBe(true);
    });
});
