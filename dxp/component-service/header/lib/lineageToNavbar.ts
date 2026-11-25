import type {SectionNavigationItem} from '../../../utils/matrix/siteLineage/types';
import type {NavigationLayout} from './types';
import type {NavbarChildItem, NavbarDropdownOptions, NavbarNavigationItem} from './navbarTypes';

export interface LineageToNavbarOptions {
    currentPageUrl?: string;
    /** Site home URL for the icon-only Home item (first in nav). */
    homeUrl?: string;
    navigationLayout?: NavigationLayout;
}

const HOME_NAV_ICON = 'qld-icon-home';
const HOME_NAV_LABEL = 'Home';

const SIMPLE_LIST_DROPDOWN_OPTIONS: NavbarDropdownOptions = {
    hasNoLink: false,
    alternativeText: '',
    description: '',
    viewAllHref: '',
};

const MEGA_MENU_VIEW_MORE_LABEL = 'View more';
/** Mega menu dropdown shows at most this many child links; excess hubs get View more → landing. */
export const MEGA_MENU_MAX_VISIBLE_CHILDREN = 9;

function normalizePathForCompare(url: string): string {
    const trimmed = url.trim();
    if (!trimmed || trimmed === '#') {
        return '';
    }

    try {
        const pathname = trimmed.startsWith('http') ? new URL(trimmed).pathname : (trimmed.split('?')[0]?.split('#')[0] ?? trimmed);
        const normalized = pathname.replace(/\/+$/, '') || '/';
        return normalized.toLowerCase();
    } catch {
        return trimmed.toLowerCase();
    }
}

function isCurrentPage(itemUrl: string | undefined, currentPageUrl?: string): boolean {
    if (!currentPageUrl?.trim() || !itemUrl?.trim()) {
        return false;
    }
    return normalizePathForCompare(itemUrl) === normalizePathForCompare(currentPageUrl);
}

function resolveNavigationLayout(layout?: NavigationLayout): NavigationLayout {
    return layout === 'megaMenu' ? 'megaMenu' : 'simpleList';
}

function dropdownOptionsForHub(hub: SectionNavigationItem, layout: NavigationLayout, totalChildCount: number): NavbarDropdownOptions {
    if (layout === 'megaMenu') {
        const showViewMore = totalChildCount > MEGA_MENU_MAX_VISIBLE_CHILDREN;
        return {
            hasNoLink: true,
            alternativeText: '',
            description: '',
            viewAllHref: showViewMore ? hub.url : '',
            viewAllLabel: showViewMore ? MEGA_MENU_VIEW_MORE_LABEL : '',
        };
    }

    return {...SIMPLE_LIST_DROPDOWN_OPTIONS};
}

function mapChildItem(child: SectionNavigationItem, options: LineageToNavbarOptions, layout: NavigationLayout): NavbarChildItem {
    const description = layout === 'megaMenu' ? (child.description ?? '').trim() : '';

    return {
        text: child.title,
        url: child.url,
        description,
        mobileOnly: false,
        target: '',
        isHTML: false,
        htmlContent: '',
        currentPage: isCurrentPage(child.url, options.currentPageUrl),
    };
}

function buildHomeNavItem(homeUrl: string, options: LineageToNavbarOptions): NavbarNavigationItem {
    return {
        text: HOME_NAV_LABEL,
        iconName: HOME_NAV_ICON,
        url: homeUrl,
        alternativeColor: false,
        mobileOnly: false,
        hideLabel: true,
        currentPage: isCurrentPage(homeUrl, options.currentPageUrl),
        target: '',
    };
}

function mapHubItem(item: SectionNavigationItem, options: LineageToNavbarOptions, layout: NavigationLayout): NavbarNavigationItem {
    const children = Array.isArray(item.children) ? item.children : [];
    const base: NavbarNavigationItem = {
        text: item.title,
        url: item.url,
        iconName: '',
        alternativeColor: false,
        mobileOnly: false,
        hideLabel: false,
        currentPage: isCurrentPage(item.url, options.currentPageUrl),
        target: '',
    };

    if (children.length === 0) {
        return base;
    }

    const visibleChildren = layout === 'megaMenu' ? children.slice(0, MEGA_MENU_MAX_VISIBLE_CHILDREN) : children;

    return {
        ...base,
        dropdownOptions: dropdownOptionsForHub(item, layout, children.length),
        navigationItems: visibleChildren.map((child) => mapChildItem(child, options, layout)),
    };
}

/** Map Content API header hubs to BS5 navbar JSON shape. */
export function lineageToNavbar(lineageItems: SectionNavigationItem[], options: LineageToNavbarOptions = {}): NavbarNavigationItem[] {
    const layout = resolveNavigationLayout(options.navigationLayout);
    const homeUrl = options.homeUrl?.trim() || '/';
    const homeItem = buildHomeNavItem(homeUrl, options);

    const hubs = (Array.isArray(lineageItems) ? lineageItems : [])
        .filter((item) => item && typeof item.title === 'string' && item.title.trim() !== '' && typeof item.url === 'string' && item.url.trim() !== '')
        .map((item) => mapHubItem(item, options, layout));

    return [homeItem, ...hubs];
}
