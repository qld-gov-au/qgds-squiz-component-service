import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../../utils/matrix/siteLineage/index', () => ({
    resolveHeaderHomeUrl: vi.fn(() => '/'),
    resolveSiteHeaderNavigation: vi.fn().mockResolvedValue([]),
}));

import {resolveSiteHeaderNavigation} from '../../utils/matrix/siteLineage/index';
import HeaderComponent from './main';
import masterBrandData from './example.data.json';
import {HeaderInput} from './lib/types';

const productionLineageEnv = {
    API_IDENTIFIER: 'apiIdentifierName',
    BASE_DOMAIN: 'https://example.com',
    BASE_PATH: '/site',
    MX_API: 'https://api.example.com',
    BEARER_AUTH: 'bearer',
};

const devUiFns = {
    resolveUri: (uri: string) => uri,
    resolveMatrixAssetById: async () => null,
};

describe('Header main (production nav)', () => {
    beforeEach(() => {
        vi.mocked(resolveSiteHeaderNavigation).mockClear();
        vi.mocked(resolveSiteHeaderNavigation).mockResolvedValue([]);
    });

    it('renders preview primary nav from fixture when matrix info is omitted', async () => {
        const rendered = await HeaderComponent.main(masterBrandData as HeaderInput);

        expect(rendered).toContain('id="main-nav"');
        expect(rendered).toContain('Simple list');
        expect(resolveSiteHeaderNavigation).not.toHaveBeenCalled();
    });

    it('renders Home-only primary nav when lineage hubs are empty', async () => {
        const rendered = await HeaderComponent.main(masterBrandData as HeaderInput, {
            env: productionLineageEnv,
        });

        expect(rendered).toContain('role="banner"');
        expect(rendered).toContain('qld-header-pre-header dark');
        expect(rendered).toContain('www.qld.gov.au');
        expect(rendered).toContain('id="main-nav"');
        expect(rendered).toContain('qld-icon-home');
        expect(rendered).not.toContain('Simple list');
    });

    it('renders author preHeader.globalLink without preview fixture spread', async () => {
        const rendered = await HeaderComponent.main(
            {
                brandLayout: 'masterBrand',
                hasDeliveringForQLDLogo: false,
                preHeader: {
                    globalLink: {
                        text: 'Agency home',
                        url: 'https://agency.example/home',
                    },
                },
                mainContent: {
                    url: {url: 'https://agency.example', target: '_self'},
                },
            },
            {
                env: {
                    API_IDENTIFIER: 'token',
                    BASE_DOMAIN: 'https://example.com',
                    BASE_PATH: '/site',
                    MX_API: 'https://api.example.com',
                    BEARER_AUTH: 'bearer',
                },
            },
        );

        expect(rendered).toContain('href="https://agency.example/home"');
        expect(rendered).toContain('Agency home');
        expect(rendered).not.toContain('www.qld.gov.au');
    });

    it('renders lineage primary nav when Content API env is configured', async () => {
        vi.mocked(resolveSiteHeaderNavigation).mockResolvedValueOnce([
            {
                id: '470',
                title: 'Alerts and Restrictions',
                url: '/alerts-and-restrictions',
                assetType: 'page_content',
                children: [],
            },
        ]);

        const rendered = await HeaderComponent.main(masterBrandData as HeaderInput, {
            env: productionLineageEnv,
        });

        expect(resolveSiteHeaderNavigation).toHaveBeenCalled();
        expect(rendered).toContain('Alerts and Restrictions');
        expect(rendered).not.toContain('Simple list');
    });

    it('renders lineage primary nav via AMAPI on info.env (dev-ui fns)', async () => {
        vi.mocked(resolveSiteHeaderNavigation).mockResolvedValueOnce([
            {
                id: '470',
                title: 'Arts programs',
                url: '/programs',
                assetType: 'page_content',
                children: [],
            },
        ]);

        const rendered = await HeaderComponent.main(masterBrandData as HeaderInput, {
            env: {
                AMAPI_TOKEN: 'dev-token',
                BASE_DOMAIN: 'https://www.arts.qld.gov.au',
                MX_API: 'http://localhost:4000/__api',
            },
            fns: devUiFns,
            ctx: {assetId: '', url: ''},
        });

        expect(resolveSiteHeaderNavigation).toHaveBeenCalled();
        expect(rendered).toContain('Arts programs');
        expect(rendered).not.toContain('Simple list');
    });
});
