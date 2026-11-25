import {describe, it, expect} from 'vitest';
import {
    buildLineageLinkLookup,
    getLineageLinkForChild,
    getRawLinkType,
    isMenuLineageLink,
    isMenuLinkedChild,
    normalizeLinkTypeValue,
    resolveLineageLinkKind,
} from './lineageLinks.js';

describe('[lineageLinks]', () => {
    describe('normalizeLinkTypeValue', () => {
        it.each([
            [1, 'menu'],
            ['1', 'menu'],
            ['menu', 'menu'],
            ['type_1', 'menu'],
            ['TYPE_1', 'menu'],
            ['Type 1', 'menu'],
            ['SQ_LINK_TYPE_1', 'menu'],
            [2, 'hidden'],
            ['2', 'hidden'],
            ['hidden', 'hidden'],
            ['type_2', 'hidden'],
            ['type-2', 'hidden'],
            ['TYPE_2', 'hidden'],
            ['Type 2', 'hidden'],
            ['SQ_LINK_TYPE_2', 'hidden'],
            [4, 'other'],
            [8, 'other'],
            ['type_3', 'other'],
            ['notice', 'other'],
            ['invisible', 'other'],
            ['reference', 'reference'],
            [null, 'missing'],
            [undefined, 'missing'],
            ['', 'missing'],
        ])('classifies scalar %j as %s', (raw, expected) => {
            expect(normalizeLinkTypeValue(raw)).toBe(expected);
        });

        it('unwraps arrays', () => {
            expect(normalizeLinkTypeValue(['type_2'])).toBe('hidden');
            expect(normalizeLinkTypeValue([2])).toBe('hidden');
            expect(normalizeLinkTypeValue(['', 'menu'])).toBe('menu');
            expect(normalizeLinkTypeValue([])).toBe('missing');
        });

        it('unwraps objects with id / code / value / name', () => {
            expect(normalizeLinkTypeValue({id: 2, code: 'type_2'})).toBe('hidden');
            expect(normalizeLinkTypeValue({id: 2})).toBe('hidden');
            expect(normalizeLinkTypeValue({code: 'TYPE_1'})).toBe('menu');
            expect(normalizeLinkTypeValue({value: ['type_2']})).toBe('hidden');
            expect(normalizeLinkTypeValue({name: 'Type 2'})).toBe('hidden');
            expect(normalizeLinkTypeValue({unexpected: true})).toBe('other');
        });
    });

    describe('real Content API link shape (`type`, no `link_type`)', () => {
        const realLink = (type: number) => ({
            id: '474524',
            type,
            value: '',
            parent_asset_id: '307374',
            child_asset_id: '309977',
            child_count: 0,
        });

        it('reads `type` when `link_type` is absent', () => {
            expect(resolveLineageLinkKind(realLink(1))).toBe('menu');
            expect(resolveLineageLinkKind(realLink(2))).toBe('hidden');
            expect(resolveLineageLinkKind(realLink(4))).toBe('other');
            expect(resolveLineageLinkKind(realLink(8))).toBe('other');
            expect(isMenuLineageLink(realLink(1))).toBe(true);
            expect(isMenuLineageLink(realLink(2))).toBe(false);
            expect(isMenuLineageLink(realLink(4))).toBe(false);
            expect(isMenuLineageLink(realLink(8))).toBe(false);
        });

        it('prefers `link_type` when both are present', () => {
            expect(
                resolveLineageLinkKind({
                    parent_asset_id: 'a',
                    child_asset_id: 'b',
                    link_type: 'menu',
                    type: 2,
                }),
            ).toBe('menu');
        });

        it('exposes the raw value via getRawLinkType', () => {
            expect(getRawLinkType(realLink(2))).toBe(2);
            expect(
                getRawLinkType({
                    parent_asset_id: 'a',
                    child_asset_id: 'b',
                    link_type: 'hidden',
                }),
            ).toBe('hidden');
            expect(getRawLinkType(undefined)).toBeUndefined();
        });
    });

    describe('isMenuLineageLink', () => {
        it('rejects links with a missing link type', () => {
            expect(isMenuLineageLink({parent_asset_id: 'a', child_asset_id: 'b'})).toBe(false);
            expect(
                isMenuLineageLink({
                    parent_asset_id: 'a',
                    child_asset_id: 'b',
                    link_type: null,
                    type: null,
                }),
            ).toBe(false);
            expect(isMenuLineageLink(undefined)).toBe(false);
            expect(isMenuLineageLink(null)).toBe(false);
        });

        it('accepts Type 1 / menu link types', () => {
            expect(
                isMenuLineageLink({
                    parent_asset_id: 'a',
                    child_asset_id: 'b',
                    link_type: 'menu',
                }),
            ).toBe(true);
            expect(
                isMenuLineageLink({
                    parent_asset_id: 'a',
                    child_asset_id: 'b',
                    link_type: 1,
                }),
            ).toBe(true);
        });

        it('rejects hidden, reference and other links', () => {
            for (const link_type of ['hidden', 'reference', 'notice', 'type_3', 2]) {
                expect(
                    isMenuLineageLink({
                        parent_asset_id: 'a',
                        child_asset_id: 'b',
                        link_type,
                    }),
                ).toBe(false);
            }
        });
    });

    describe('buildLineageLinkLookup / getLineageLinkForChild', () => {
        it("prefers the exact parent->child link over another parent's link", () => {
            const lookup = buildLineageLinkLookup([
                {parent_asset_id: 'a', child_asset_id: 'c', link_type: 'menu'},
                {parent_asset_id: 'b', child_asset_id: 'c', link_type: 'hidden'},
            ]);

            expect(getLineageLinkForChild('c', lookup, 'a')?.link_type).toBe('menu');
            expect(getLineageLinkForChild('c', lookup, 'b')?.link_type).toBe('hidden');
        });

        it('falls back to the bare child id when the parent is unknown', () => {
            const lookup = buildLineageLinkLookup([{parent_asset_id: 'a', child_asset_id: 'c', link_type: 'menu'}]);

            expect(getLineageLinkForChild('c', lookup)?.link_type).toBe('menu');
            expect(getLineageLinkForChild('c', lookup, 'other')?.link_type).toBe('menu');
            expect(getLineageLinkForChild('missing', lookup, 'a')).toBeUndefined();
        });

        it('ignores malformed links', () => {
            const lookup = buildLineageLinkLookup([null, {parent_asset_id: 'a'}] as never);
            expect(lookup.size).toBe(0);
        });
    });

    describe('isMenuLinkedChild', () => {
        it('hides children with no link record', () => {
            const lookup = buildLineageLinkLookup([]);
            expect(isMenuLinkedChild('orphan', lookup)).toBe(false);
        });

        it('hides children whose inbound link has no type', () => {
            const lookup = buildLineageLinkLookup([{parent_asset_id: '465', child_asset_id: 'untyped'}]);
            expect(isMenuLinkedChild('untyped', lookup, '465')).toBe(false);
        });

        it('shows Type 1 and hides Type 2, Type 3 and notice (real `type` shape)', () => {
            const lookup = buildLineageLinkLookup([
                {parent_asset_id: '465', child_asset_id: 'menu', type: 1},
                {parent_asset_id: '465', child_asset_id: 'hidden', type: 2},
                {parent_asset_id: '465', child_asset_id: 'type3', type: 4},
                {parent_asset_id: '465', child_asset_id: 'notice', type: 8},
            ]);

            expect(isMenuLinkedChild('menu', lookup, '465')).toBe(true);
            expect(isMenuLinkedChild('hidden', lookup, '465')).toBe(false);
            expect(isMenuLinkedChild('type3', lookup, '465')).toBe(false);
            expect(isMenuLinkedChild('notice', lookup, '465')).toBe(false);
        });

        it('detects hidden links expressed as object or array shapes', () => {
            const lookup = buildLineageLinkLookup([
                {
                    parent_asset_id: 's',
                    child_asset_id: 'obj',
                    link_type: {id: 2, code: 'type_2'},
                },
                {
                    parent_asset_id: 's',
                    child_asset_id: 'arr',
                    link_type: ['type_2'],
                },
            ] as never);

            expect(isMenuLinkedChild('obj', lookup, 's')).toBe(false);
            expect(isMenuLinkedChild('arr', lookup, 's')).toBe(false);
        });

        it('uses the exact parent->child edge', () => {
            const lookup = buildLineageLinkLookup([
                {parent_asset_id: 'a', child_asset_id: 'c', type: 1},
                {parent_asset_id: 'b', child_asset_id: 'c', type: 2},
            ]);

            expect(isMenuLinkedChild('c', lookup, 'a')).toBe(true);
            expect(isMenuLinkedChild('c', lookup, 'b')).toBe(false);
        });
    });
});
