import {describe, expect, it, vi} from 'vitest';
import {resolveHeaderSquizLinks} from './resolveHeaderSquizLinks';

describe('resolveHeaderSquizLinks', () => {
    it('resolves preHeader.globalLink via resolveMatrixAssetById', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValue({
            url: 'https://example.com/global',
            name: 'Global link',
        });

        const result = await resolveHeaderSquizLinks(
            {
                preHeader: {
                    globalLink: {
                        matrixAssetId: '8',
                        target: '_self',
                    },
                },
            },
            {fns: {resolveMatrixAssetById}},
        );

        expect(resolveMatrixAssetById).toHaveBeenCalledWith('8');
        expect(result.preHeader?.globalLink).toMatchObject({
            url: 'https://example.com/global',
            text: 'Global link',
        });
    });

    it('resolves plain pre-header action link on dropdown when type is none', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValue({
            url: 'https://example.com/contact',
            name: 'Contact',
        });

        const result = await resolveHeaderSquizLinks(
            {
                preHeader: {
                    actions: [
                        {
                            dropdown: {
                                type: 'none',
                                icon: 'phone',
                                link: {matrixAssetId: '7'},
                            },
                        },
                    ],
                },
            },
            {fns: {resolveMatrixAssetById}},
        );

        expect(resolveMatrixAssetById).toHaveBeenCalledWith('7');
        expect(result.preHeader?.actions?.[0]?.dropdown?.link).toMatchObject({
            url: 'https://example.com/contact',
            text: 'Contact',
        });
    });

    it('resolves dropdown items', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValueOnce({
            url: 'https://example.com/item',
            name: 'Item',
        });

        const result = await resolveHeaderSquizLinks(
            {
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
            {fns: {resolveMatrixAssetById}},
        );

        expect(result.preHeader?.actions?.[0]?.dropdown?.items?.[0]).toMatchObject({
            url: 'https://example.com/item',
            text: 'Item',
        });
    });

    it('resolves mainContent.url via resolveMatrixAssetById', async () => {
        const resolveMatrixAssetById = vi.fn().mockResolvedValue({
            url: 'https://example.com/brand',
            name: 'Brand home',
        });

        const result = await resolveHeaderSquizLinks(
            {
                mainContent: {
                    url: {matrixAssetId: '42', target: '_self'},
                },
            },
            {fns: {resolveMatrixAssetById}},
        );

        expect(resolveMatrixAssetById).toHaveBeenCalledWith('42');
        expect(result.mainContent?.url).toMatchObject({
            url: 'https://example.com/brand',
            text: 'Brand home',
        });
    });

    it('returns input unchanged when no SquizLink fields need resolution', async () => {
        const input = {brandLayout: 'masterBrand' as const};
        expect(await resolveHeaderSquizLinks(input)).toEqual(input);
    });
});
