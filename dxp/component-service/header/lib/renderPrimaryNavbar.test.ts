import {describe, expect, it} from 'vitest';
import {renderPrimaryNavbar} from './renderPrimaryNavbar';
import type {NavbarNavigationItem} from './navbarTypes';

describe('renderPrimaryNavbar', () => {
    it('renders mega menu child description and View more link', () => {
        const navigation: NavbarNavigationItem[] = [
            {
                text: 'Funding',
                url: '/funding',
                dropdownOptions: {
                    hasNoLink: true,
                    viewAllHref: '/funding',
                    viewAllLabel: 'View more',
                },
                navigationItems: [
                    {
                        text: 'Previous funding',
                        url: '/funding/previous',
                        description: "Arts Queensland invests in the state's arts and cultural sector.",
                    },
                ],
            },
        ];

        const html = renderPrimaryNavbar({navigation});

        expect(html).toContain('id="main-nav"');
        expect(html).toContain('Previous funding');
        expect(html).toContain("Arts Queensland invests in the state's arts and cultural sector.");
        expect(html).toContain('class="dropdown-item view-all"');
        expect(html).toContain('href="/funding"');
        expect(html).toContain('View more');
        expect(html).toContain('<p>');
    });

    it('omits child paragraph when description is empty', () => {
        const navigation: NavbarNavigationItem[] = [
            {
                text: 'Hub',
                url: '/hub',
                navigationItems: [
                    {
                        text: 'Child',
                        url: '/hub/child',
                        description: '',
                    },
                ],
            },
        ];

        const html = renderPrimaryNavbar({navigation});
        expect(html).toContain('Child');
        expect(html).not.toMatch(/<p>\s*<\/p>/);
    });
});
