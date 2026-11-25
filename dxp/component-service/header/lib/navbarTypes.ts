export interface NavbarMetadata {
    alternativeColor?: boolean;
    verticalOrientation?: boolean;
    navbarBrandName?: string;
}

export interface NavbarDropdownOptions {
    hasNoLink?: boolean;
    alternativeText?: string;
    description?: string;
    viewAllHref?: string;
    /** Overrides default "View all" when `viewAllHref` is set (mega menu uses "View more"). */
    viewAllLabel?: string;
}

export interface NavbarChildItem {
    text?: string;
    description?: string;
    url?: string;
    mobileOnly?: boolean;
    target?: string;
    isHTML?: boolean;
    htmlContent?: string;
    currentPage?: boolean;
}

export interface NavbarNavigationItem {
    text?: string;
    iconName?: string;
    url?: string;
    alternativeColor?: boolean;
    mobileOnly?: boolean;
    hideLabel?: boolean;
    currentPage?: boolean;
    target?: string;
    isExpandedOnMobile?: boolean;
    dropdownOptions?: NavbarDropdownOptions;
    navigationItems?: NavbarChildItem[];
}

export interface LocalHeaderData {
    metadata: NavbarMetadata;
    navigation: NavbarNavigationItem[];
}
