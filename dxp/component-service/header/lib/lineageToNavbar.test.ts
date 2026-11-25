import {describe, expect, it} from 'vitest';
import previewHeaderNavigation from '../../../utils/matrix/siteLineage/fixtures/preview-header-navigation.json';
import type {SectionNavigationItem} from '../../../utils/matrix/siteLineage/types';
import {lineageToNavbar} from './lineageToNavbar';

describe('lineageToNavbar', () => {
    it('maps hubs with children to dropdown navigation items', () => {
        const items = previewHeaderNavigation as SectionNavigationItem[];
        const navigation = lineageToNavbar(items);

        expect(navigation.length).toBeGreaterThan(1);
        expect(navigation[0]).toMatchObject({
            text: 'Home',
            iconName: 'qld-icon-home',
            hideLabel: true,
            url: '/',
        });
        const sectionOne = navigation.find((item) => item.text === 'Section one');
        expect(sectionOne?.navigationItems?.length).toBeGreaterThan(0);
    });

    it('marks current page on hub and child when URLs match', () => {
        const items = previewHeaderNavigation as SectionNavigationItem[];
        const navigation = lineageToNavbar(items, {
            currentPageUrl: '/section-one/overview',
        });

        expect(navigation[0]?.text).toBe('Home');

        const hub = navigation.find((item) => item.text === 'Section one');
        const child = hub?.navigationItems?.find((item) => item.text === 'Overview');

        expect(child?.currentPage).toBe(true);
        expect(hub?.currentPage).toBe(false);
    });

    it('uses simple list dropdown defaults by default', () => {
        const items: SectionNavigationItem[] = [
            {
                id: 'hub',
                title: 'Hub',
                url: '/hub',
                children: [
                    {
                        id: 'child',
                        title: 'Child',
                        url: '/hub/child',
                        description: 'Should not show',
                    },
                ],
            },
        ];

        const navigation = lineageToNavbar(items);
        const hub = navigation.find((item) => item.text === 'Hub');

        expect(hub?.dropdownOptions).toMatchObject({
            hasNoLink: false,
            viewAllHref: '',
        });
        expect(hub?.navigationItems?.[0]?.description).toBe('');
    });

    it('maps mega menu hubs with child descriptions and no view more when at most nine children', () => {
        const items: SectionNavigationItem[] = [
            {
                id: 'hub',
                title: 'Hub',
                url: '/hub',
                children: [
                    {
                        id: 'child',
                        title: 'Child',
                        url: '/hub/child',
                        description: 'Mega blurb',
                    },
                ],
            },
        ];

        const navigation = lineageToNavbar(items, {navigationLayout: 'megaMenu'});
        const hub = navigation.find((item) => item.text === 'Hub');

        expect(hub?.dropdownOptions).toMatchObject({
            hasNoLink: true,
            viewAllHref: '',
        });
        expect(hub?.navigationItems?.[0]?.description).toBe('Mega blurb');
    });

    it('limits mega menu to nine children and adds view more when there are more', () => {
        const children = Array.from({length: 10}, (_, index) => ({
            id: `child-${index}`,
            title: `Child ${index + 1}`,
            url: `/hub/child-${index + 1}`,
            description: `Blurb ${index + 1}`,
        }));

        const navigation = lineageToNavbar(
            [
                {
                    id: 'hub',
                    title: 'Hub',
                    url: '/hub',
                    children,
                },
            ],
            {navigationLayout: 'megaMenu'},
        );
        const hub = navigation.find((item) => item.text === 'Hub');

        expect(hub?.navigationItems).toHaveLength(9);
        expect(hub?.navigationItems?.[0]?.text).toBe('Child 1');
        expect(hub?.navigationItems?.[8]?.text).toBe('Child 9');
        expect(hub?.navigationItems?.some((item) => item.text === 'Child 10')).toBe(false);
        expect(hub?.dropdownOptions).toMatchObject({
            hasNoLink: true,
            viewAllHref: '/hub',
            viewAllLabel: 'View more',
        });
    });

    it('prepends Home first and marks current page on home URL match', () => {
        const navigation = lineageToNavbar([], {
            homeUrl: '/arts-rebuild-2026',
            currentPageUrl: '/arts-rebuild-2026',
        });

        expect(navigation).toHaveLength(1);
        expect(navigation[0]).toMatchObject({
            text: 'Home',
            iconName: 'qld-icon-home',
            hideLabel: true,
            currentPage: true,
            url: '/arts-rebuild-2026',
        });
    });
});
