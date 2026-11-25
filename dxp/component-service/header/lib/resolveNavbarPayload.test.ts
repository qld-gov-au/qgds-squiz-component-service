import {beforeEach, describe, expect, it, vi} from 'vitest';
import {enrichSectionNavigationChildDescriptions, resolveSiteHeaderNavigation} from '../../../utils/matrix/siteLineage/index';
import masterBrandData from '../example.data.json';
import {resolveNavbarPayload} from './resolveNavbarPayload';

const {lineageHub} = vi.hoisted(() => ({
    lineageHub: {
        id: 'live-hub',
        title: 'Live hub',
        url: '/live',
        assetType: 'page_content',
        children: [
            {
                id: 'child-1',
                title: 'Child page',
                url: '/live/child',
            },
        ],
    },
}));

vi.mock('../../../utils/matrix/siteLineage/index', () => ({
    resolveHeaderHomeUrl: vi.fn(() => '/'),
    resolveSiteHeaderNavigation: vi.fn().mockResolvedValue([lineageHub]),
    enrichSectionNavigationChildDescriptions: vi.fn(async (items) => items),
}));

vi.mock('../../../utils/matrix/contentApiLocalProxy/resolveLineageContentApiFetchImpl', () => ({
    resolveLineageContentApiFetchImpl: vi.fn(() => vi.fn()),
}));

const productionEnv = {
    API_IDENTIFIER: 'id',
    BASE_DOMAIN: 'https://example.com',
    BASE_PATH: '/site',
    MX_API: 'https://api.example.com/__api',
    BEARER_AUTH: 'token',
};

describe('resolveNavbarPayload', () => {
    beforeEach(() => {
        vi.mocked(resolveSiteHeaderNavigation).mockClear();
        vi.mocked(enrichSectionNavigationChildDescriptions).mockClear();
    });

    it('uses preview navigation when lineage env is not configured', async () => {
        const payload = await resolveNavbarPayload(undefined, masterBrandData);
        expect(payload.navigation.some((item) => item.text === 'Simple list')).toBe(true);
    });

    it('returns empty nav when lineage env is missing and input has no preview navigation', async () => {
        const payload = await resolveNavbarPayload(undefined, {
            brandLayout: 'masterBrand',
        });
        expect(payload.navigation).toHaveLength(0);
    });

    it('prefers lineage over preview navigation when lineage env is configured', async () => {
        const payload = await resolveNavbarPayload({env: productionEnv}, masterBrandData);
        expect(payload.navigation.some((item) => item.text === 'Live hub')).toBe(true);
        expect(payload.navigation.some((item) => item.text === 'Simple list')).toBe(false);
    });

    it('uses manifest preview navigation on local dev even when AMAPI env is configured', async () => {
        const payload = await resolveNavbarPayload(
            {
                env: {
                    IS_LOCAL: 'true',
                    AMAPI_TOKEN: 'dev-token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                    MX_API: 'http://localhost:4000/__api',
                },
                fns: {
                    resolveUri: () => '',
                    resolveMatrixAssetById: async () => null,
                },
            },
            masterBrandData,
        );

        expect(payload.navigation.some((item) => item.text === 'Simple list')).toBe(true);
        expect(payload.navigation.some((item) => item.text === 'Live hub')).toBe(false);
        expect(resolveSiteHeaderNavigation).not.toHaveBeenCalled();
    });

    it('uses lineage via AMAPI when preview navigation is absent on input', async () => {
        const payload = await resolveNavbarPayload(
            {
                fns: {
                    resolveUri: () => '',
                    resolveMatrixAssetById: async () => null,
                },
                env: {
                    AMAPI_TOKEN: 'dev-token',
                    BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                    MX_API: 'http://localhost:4000/__api',
                },
            },
            {brandLayout: 'masterBrand'},
        );
        expect(payload.navigation.some((item) => item.text === 'Live hub')).toBe(true);
        expect(resolveSiteHeaderNavigation).toHaveBeenCalled();
    });

    it('enriches lineage children when mega menu and metadata field key are set', async () => {
        await resolveNavbarPayload(
            {env: productionEnv},
            {
                brandLayout: 'masterBrand',
                navigation: {
                    layout: 'megaMenu',
                    descriptionMetadataFieldKey: 'page-lead',
                },
            },
        );

        expect(enrichSectionNavigationChildDescriptions).toHaveBeenCalledWith(
            [lineageHub],
            expect.objectContaining({
                metadataFieldKey: 'page-lead',
            }),
        );
    });

    it('skips metadata enrichment for simple list layout', async () => {
        await resolveNavbarPayload(
            {env: productionEnv},
            {
                brandLayout: 'masterBrand',
                navigation: {layout: 'simpleList'},
            },
        );

        expect(enrichSectionNavigationChildDescriptions).not.toHaveBeenCalled();
    });
});
