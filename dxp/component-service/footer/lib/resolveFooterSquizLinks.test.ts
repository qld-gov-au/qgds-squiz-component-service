import {describe, expect, it, vi} from 'vitest';
import FooterComponent from '../main';
import type {FooterInput} from '../types';
import {resolveFooterSquizLinks} from './resolveFooterSquizLinks';

/** Fixture-only Matrix asset lookup. No network calls. */
function assetResolver() {
    const assets: Record<string, {url: string; name: string}> = {
        '10': {url: 'https://www.qld.gov.au/apply', name: 'Apply'},
        '11': {url: 'https://www.qld.gov.au/jobs', name: 'Jobs'},
        '12': {url: 'https://www.qld.gov.au/one', name: 'One'},
        '13': {url: 'https://www.qld.gov.au/two', name: 'Two'},
        '14': {url: 'https://www.qld.gov.au/three', name: 'Three'},
    };
    return vi.fn(async (assetId: string) => assets[assetId] ?? {});
}

describe('resolveFooterSquizLinks', () => {
    it('resolves every Matrix asset SquizLink on the footer', async () => {
        const resolveMatrixAssetById = assetResolver();
        const input: FooterInput = {
            contact: {button: {matrixAssetId: '10'}},
            footerLinks: {list: [{matrixAssetId: '11'}]},
            optionalColumn1: {
                followLinks: [{icon: 'x', link: {matrixAssetId: '12'}}],
                customLinks: [{matrixAssetId: '13'}],
            },
            optionalColumn2: {
                customLinks: [{matrixAssetId: '14'}],
            },
        };

        const result = await resolveFooterSquizLinks(input, {
            fns: {resolveMatrixAssetById},
        });

        expect(resolveMatrixAssetById.mock.calls.map(([assetId]) => assetId).sort()).toEqual(['10', '11', '12', '13', '14']);
        expect(result.contact?.button).toMatchObject({
            url: 'https://www.qld.gov.au/apply',
            text: 'Apply',
        });
        expect(result.footerLinks?.list?.[0]).toMatchObject({
            url: 'https://www.qld.gov.au/jobs',
            text: 'Jobs',
        });
        expect(result.optionalColumn1?.followLinks?.[0]?.link).toMatchObject({
            url: 'https://www.qld.gov.au/one',
            text: 'One',
        });
        expect(result.optionalColumn1?.customLinks?.[0]).toMatchObject({
            url: 'https://www.qld.gov.au/two',
            text: 'Two',
        });
        expect(result.optionalColumn2?.customLinks?.[0]).toMatchObject({
            url: 'https://www.qld.gov.au/three',
            text: 'Three',
        });
    });

    it('does not call the resolver for links that already have a manual url', async () => {
        const resolveMatrixAssetById = assetResolver();
        const input: FooterInput = {
            optionalColumn1: {
                customLinks: [{text: 'Manual', url: 'https://manual.example/'}],
            },
        };

        const result = await resolveFooterSquizLinks(input, {
            fns: {resolveMatrixAssetById},
        });

        expect(resolveMatrixAssetById).not.toHaveBeenCalled();
        expect(result.optionalColumn1?.customLinks).toEqual([{text: 'Manual', url: 'https://manual.example/'}]);
    });

    it('keeps author-entered text when the url comes from a Matrix asset', async () => {
        const result = await resolveFooterSquizLinks(
            {
                optionalColumn1: {
                    customLinks: [{text: 'Custom label', matrixAssetId: '13'}],
                },
            },
            {fns: {resolveMatrixAssetById: assetResolver()}},
        );

        expect(result.optionalColumn1?.customLinks?.[0]).toMatchObject({
            url: 'https://www.qld.gov.au/two',
            text: 'Custom label',
        });
    });

    it('keeps the original link when the asset cannot be resolved', async () => {
        const link = {matrixAssetId: '999'};

        const result = await resolveFooterSquizLinks({optionalColumn1: {customLinks: [link]}}, {fns: {resolveMatrixAssetById: assetResolver()}});

        expect(result.optionalColumn1?.customLinks).toEqual([link]);
    });

    it('leaves Matrix asset links unchanged when no resolver is available', async () => {
        const result = await resolveFooterSquizLinks({
            optionalColumn1: {customLinks: [{matrixAssetId: '13'}]},
        });

        expect(result.optionalColumn1?.customLinks).toEqual([{matrixAssetId: '13'}]);
    });

    it('returns an empty input unchanged', async () => {
        expect(await resolveFooterSquizLinks({})).toEqual({});
    });
});

describe('Footer main with Matrix asset links', () => {
    it('renders the resolved contact button URL and label', async () => {
        const rendered = await FooterComponent.main({contact: {button: {matrixAssetId: '10'}}}, {fns: {resolveMatrixAssetById: assetResolver()}});

        expect(rendered).toContain('<a href="https://www.qld.gov.au/apply" class="btn btn-outline-secondary">Apply</a>');
    });
});
