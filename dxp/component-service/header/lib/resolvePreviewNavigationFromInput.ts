import type {NavbarMetadata, NavbarNavigationItem} from './navbarTypes';
import type {HeaderInput} from './types';

const DEFAULT_METADATA: NavbarMetadata = {
    alternativeColor: false,
    verticalOrientation: false,
    navbarBrandName: 'Menu',
};

function isNavigationItem(value: unknown): value is NavbarNavigationItem {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const item = value as NavbarNavigationItem;
    return typeof item.text === 'string' || typeof item.url === 'string';
}

/** Preview / Vitest fixture nav from manifest preview JSON (not manifest schema). */
export function resolvePreviewNavigationFromInput(input?: HeaderInput): {navigation: NavbarNavigationItem[]; metadata: NavbarMetadata} | null {
    if (!input?.previewNavigation?.length) {
        return null;
    }

    const navigation = input.previewNavigation.filter(isNavigationItem);
    if (navigation.length === 0) {
        return null;
    }

    const metadata = input.navbarMetadata ?? DEFAULT_METADATA;

    return {
        navigation,
        metadata: {
            alternativeColor: Boolean(metadata.alternativeColor),
            verticalOrientation: Boolean(metadata.verticalOrientation),
            navbarBrandName: typeof metadata.navbarBrandName === 'string' ? metadata.navbarBrandName : DEFAULT_METADATA.navbarBrandName,
        },
    };
}
