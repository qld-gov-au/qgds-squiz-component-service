import {describe, expect, it, vi} from 'vitest';
import {useIsolatedMatrixEnvForHeaderIntegrationTests} from './header.integrationTestEnv';
import HeaderComponent from './main';
import masterBrandData from './example.data.json';
import coBrandData from './example.coBrand.data.json';
import endorsedData from './example.endorsed.data.json';
import standAloneData from './example.standAlone.data.json';
import subBrandData from './example.subBrand.data.json';

describe('Header', () => {
    useIsolatedMatrixEnvForHeaderIntegrationTests();

    it('renders banner landmark and pre-header global link (master brand)', async () => {
        const rendered = await HeaderComponent.main(masterBrandData);
        expect(rendered).toContain('role="banner"');
        expect(rendered).toContain('qld-header-pre-header dark');
        expect(rendered).toContain('www.qld.gov.au');
        expect(rendered).toContain('href="https://qld.gov.au"');
        expect(rendered).toContain('is-delivering-for-qld');
        expect(rendered).toContain('dropdown-toggle');
        expect(rendered).toContain('qld-header-site-search');
    });

    it('renders Arts site search form with Funnelback data attributes', async () => {
        const rendered = await HeaderComponent.main(masterBrandData);
        expect(rendered).toContain('action="https://www.arts.qld.gov.au/search"');
        expect(rendered).toContain('data-collection="ssqld~sp-arts-queensland"');
        expect(rendered).toContain('data-profile="arts-queensland-search"');
        expect(rendered).toContain('data-suggestions="https://ssqld-search.funnelback.squiz.cloud/s/suggest.json"');
        expect(rendered).toContain('data-numranks="10"');
        expect(rendered).toContain('data-tiers="off"');
        expect(rendered).toContain('dynamic-suggestions');
    });

    it('omits site search when enabled is hide', async () => {
        const rendered = await HeaderComponent.main({
            ...masterBrandData,
            assets: {
                ...masterBrandData.assets,
                siteSearch: {
                    ...masterBrandData.assets?.siteSearch,
                    enabled: 'hide',
                },
            },
        });
        expect(rendered).not.toContain('qld-header-site-search');
    });

    it('renders primary navbar from preview fixture when Matrix env is missing', async () => {
        const rendered = await HeaderComponent.main(masterBrandData);
        expect(rendered).toContain('id="main-nav"');
        expect(rendered).toContain('aria-label="Website navigation"');
        expect(rendered).toContain('aria-current="page"');
        expect(rendered).toContain('qld-icon-home');
        expect(rendered).toContain('Simple list');
    });

    it('renders sub-brand pre-header icon links and site title', async () => {
        const rendered = await HeaderComponent.main(subBrandData);
        expect(rendered).toContain('qld-icon-phone');
        expect(rendered).toContain('qld-header-site-title');
        expect(rendered).toContain('Department of Seniors, Disability Services and Aboriginal and Torres Strait Islander Partnerships');
    });

    it('renders co-brand site title and subline', async () => {
        const rendered = await HeaderComponent.main(coBrandData);
        expect(rendered).toContain('qld-header-main dark');
        expect(rendered).toContain('Cairns and Hinterland');
        expect(rendered).toContain('qld-header-subline');
        expect(rendered).toContain('Hospital and Health Service');
    });

    it('renders endorsed brand primary and secondary logos', async () => {
        const rendered = await HeaderComponent.main(endorsedData);
        expect(rendered).toContain('qld-gov-au.github.io/qgds-bootstrap5/assets/img/endorsed.svg');
        expect(rendered).toContain('qld-header-secondary-image');
        expect(rendered).toContain('qld-header-main dark-alt');
    });

    it('renders standalone brand layout', async () => {
        const rendered = await HeaderComponent.main(standAloneData);
        expect(rendered).toContain('qld-header-pre-header dark-alt');
        expect(rendered).toContain('qld-header-brand');
    });

    it('uses master brand COA in main region for master brand layout', async () => {
        const rendered = await HeaderComponent.main(masterBrandData);
        const mainHtml = rendered.split('qld-header-main')[1]?.split('</header>')[0] ?? '';
        expect(mainHtml).toContain('qld-header-brand-image');
        expect(mainHtml).toContain('is-delivering-for-qld');
        expect(mainHtml).toContain('viewBox="0 0 331 56"');
    });

    it('ignores primary logo on master brand when stale logo is in input', async () => {
        const rendered = await HeaderComponent.main({
            ...masterBrandData,
            mainContent: {
                ...masterBrandData.mainContent,
                logo: endorsedData.mainContent?.logo,
                siteTitle: 'Ignored title',
            },
        });
        const mainHtml = rendered.split('qld-header-main')[1]?.split('</header>')[0] ?? '';
        expect(mainHtml).not.toContain('qld-gov-au.github.io');
        expect(mainHtml).not.toContain('qld-header-site-title');
    });

    it('renders co-brand stacked COA modifier class', async () => {
        const rendered = await HeaderComponent.main(coBrandData);
        expect(rendered).toContain('qld-header-brand--co-brand');
        const mainHtml = rendered.split('qld-header-main')[1]?.split('</header>')[0] ?? '';
        expect(mainHtml).not.toContain('<img');
    });

    it('renders data-sq-field paths in editor context', async () => {
        const rendered = await HeaderComponent.main(masterBrandData, {
            ctx: {editor: true},
        });
        expect(rendered).toContain('data-sq-field="preHeader.globalLink"');
        expect(rendered).toContain('data-sq-field="assets.siteSearch.label"');
        expect(rendered).toContain('data-sq-field="assets.siteSearch.searchResultsUrl"');
        expect(rendered).toContain('data-sq-field="componentAdvancedOptions.id"');
    });

    it('renders pre-header dropdown SquizLink fields with editor data-sq-field', async () => {
        const rendered = await HeaderComponent.main(masterBrandData, {
            ctx: {editor: true},
        });
        expect(rendered).toContain('data-sq-field="preHeader.actions[0].dropdown.items[0]"');
        expect(rendered).toContain('data-sq-field="preHeader.actions[0].dropdown.viewMore"');
    });

    it('renders pre-header action SquizLink with editor data-sq-field', async () => {
        const rendered = await HeaderComponent.main(subBrandData, {
            ctx: {editor: true},
        });
        expect(rendered).toContain('data-sq-field="preHeader.actions[0].dropdown.link"');
        expect(rendered).toContain('qld-icon-phone');
    });

    it('renders SquizImage logo fields with editor data-sq-field', async () => {
        const rendered = await HeaderComponent.main(endorsedData, {
            ctx: {editor: true},
        });
        expect(rendered).toContain('data-sq-field="mainContent.logo"');
        expect(rendered).toContain('data-sq-field="mainContent.secondaryLogo"');
        expect(rendered).toContain('Primary logo Endorsed brand alt text');
    });

    it('uses main palette from brand layout when stale palette is in input', async () => {
        const rendered = await HeaderComponent.main({
            ...masterBrandData,
            mainContent: {
                ...masterBrandData.mainContent,
                palette: 'dark-alt',
            },
        });
        expect(rendered).toContain('qld-header-main default');
        expect(rendered).not.toContain('qld-header-main dark-alt');
    });

    it('sub-brand image lockup renders secondary image and ignores stale site title', async () => {
        const secondaryLogo = endorsedData.mainContent?.secondaryLogo;
        const rendered = await HeaderComponent.main({
            brandLayout: 'subBrand',
            hasDeliveringForQLDLogo: true,
            preHeader: {},
            mainContent: {
                palette: 'default',
                url: 'https://qld.gov.au',
                secondaryLockupType: 'image',
                siteTitle: 'Stale title',
                secondaryLogo,
            },
        });

        expect(rendered).toContain('qld-header-secondary-image');
        expect(rendered).not.toContain('Stale title');
    });

    it('renders global link text from SquizLink when Matrix asset is selected', async () => {
        const rendered = await HeaderComponent.main({
            brandLayout: 'masterBrand',
            preHeader: {
                globalLink: {
                    url: 'https://www.example.com/example-page',
                    text: 'Example Page',
                },
            },
        });

        expect(rendered).toContain('Example Page');
        expect(rendered).not.toContain('>qld.gov.au<');
    });

    it('renders main brand link from Matrix asset picker via resolveMatrixAssetById', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValue({
            url: 'https://example.com/brand-home',
            name: 'Brand',
        });

        const rendered = await HeaderComponent.main(
            {
                brandLayout: 'masterBrand',
                mainContent: {
                    palette: 'default',
                    url: {
                        matrixAssetId: '10',
                        target: '_self',
                    },
                },
            },
            {fns: {resolveMatrixAssetById}, ctx: {editor: true}},
        );

        expect(resolveMatrixAssetById).toHaveBeenCalledWith('10');
        expect(rendered).toContain('href="https://example.com/brand-home"');
        expect(rendered).toContain('data-sq-field="mainContent.url"');
    });

    it('renders global link from Matrix asset picker via resolveMatrixAssetById', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValue({
            url: 'https://example.com/standard-page',
            name: 'Standard Page',
        });

        const rendered = await HeaderComponent.main(
            {
                brandLayout: 'masterBrand',
                preHeader: {
                    globalLink: {
                        matrixAssetId: '8',
                        matrixIdentifier: 'matrixIdentifier',
                        target: '_self',
                    },
                },
            },
            {fns: {resolveMatrixAssetById}},
        );

        expect(resolveMatrixAssetById).toHaveBeenCalledWith('8');
        expect(rendered).toContain('href="https://example.com/standard-page"');
        expect(rendered).toContain('Standard Page');
        expect(rendered).not.toContain('href="https://qld.gov.au"');
    });

    it('renders pre-header dropdown item from Matrix asset picker via resolveMatrixAssetById', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValue({
            url: 'https://example.com/dropdown-item',
            name: 'Resolved item',
        });

        const rendered = await HeaderComponent.main(
            {
                brandLayout: 'masterBrand',
                preHeader: {
                    actions: [
                        {
                            text: 'Menu',
                            dropdown: {
                                type: 'list',
                                items: [{matrixAssetId: '99'}],
                            },
                        },
                    ],
                },
            },
            {fns: {resolveMatrixAssetById}, ctx: {editor: true}},
        );

        expect(resolveMatrixAssetById).toHaveBeenCalledWith('99');
        expect(rendered).toContain('href="https://example.com/dropdown-item"');
        expect(rendered).toContain('Resolved item');
        expect(rendered).toContain('data-sq-field="preHeader.actions[0].dropdown.items[0]"');
    });

    it('renders global link href from author SquizLink url', async () => {
        const rendered = await HeaderComponent.main({
            brandLayout: 'masterBrand',
            preHeader: {
                globalLink: {
                    text: 'www.qld.gov.au',
                    url: 'https://www.some-link.com.au',
                },
            },
        });

        expect(rendered).toContain('href="https://www.some-link.com.au"');
        expect(rendered).toContain('www.qld.gov.au');
    });

    it('author globalLink overrides preview fixture url when input is explicit', async () => {
        const rendered = await HeaderComponent.main({
            ...masterBrandData,
            preHeader: {
                ...masterBrandData.preHeader,
                globalLink: {
                    text: 'Custom label',
                    url: 'https://author.example/custom',
                },
            },
        });

        expect(rendered).toContain('href="https://author.example/custom"');
        expect(rendered).toContain('Custom label');
        const preHeaderHtml = rendered.split('qld-header-main')[0] ?? '';
        expect(preHeaderHtml).not.toContain('href="https://qld.gov.au"');
    });

    it('uses master-brand global link defaults when preHeader.globalLink is unset', async () => {
        const rendered = await HeaderComponent.main({
            brandLayout: 'masterBrand',
            hasDeliveringForQLDLogo: true,
            preHeader: {},
        });

        expect(rendered).toContain('href="https://qld.gov.au"');
        expect(rendered).toContain('qld.gov.au');
    });

    it('renders pre-header dropdown SquizLink item label and href from input', async () => {
        const rendered = await HeaderComponent.main(masterBrandData);

        expect(rendered).toContain('Transport and motoring');
        expect(rendered).toContain('href="#"');
        expect(rendered).toContain('View all');
        expect(rendered).toContain('https://www.qld.gov.au/queenslanders');
    });
});
