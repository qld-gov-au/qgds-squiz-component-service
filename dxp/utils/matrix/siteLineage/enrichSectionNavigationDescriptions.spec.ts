import {describe, expect, it, vi} from 'vitest';
import {enrichSectionNavigationChildDescriptions} from './enrichSectionNavigationDescriptions.js';
import type {SectionNavigationItem} from './types.js';

describe('enrichSectionNavigationChildDescriptions', () => {
    it('returns items unchanged when field id is empty', async () => {
        const items: SectionNavigationItem[] = [
            {
                id: 'hub',
                title: 'Hub',
                url: '/hub',
                children: [{id: 'child-1', title: 'Child', url: '/hub/child'}],
            },
        ];

        const fetchImpl = vi.fn();
        const result = await enrichSectionNavigationChildDescriptions(items, {
            metadataFieldKey: '',
            fetchImpl,
        });

        expect(result).toEqual(items);
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('fetches metadata per child and sets description', async () => {
        const items: SectionNavigationItem[] = [
            {
                id: 'hub',
                title: 'Hub',
                url: '/hub',
                children: [{id: 'child-1', title: 'Child', url: '/hub/child'}],
            },
        ];

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                metadata: {'page-lead': 'From metadata'},
            }),
        });

        const result = await enrichSectionNavigationChildDescriptions(items, {
            metadataFieldKey: 'page-lead',
            info: {
                env: {
                    MX_API: 'https://example.com/__api',
                    BEARER_AUTH: 'token',
                },
            },
            fetchImpl,
        });

        expect(fetchImpl).toHaveBeenCalled();
        expect(result[0]?.children?.[0]?.description).toBe('From metadata');
    });
});
