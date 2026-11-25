import {resolveLineageContentApiFetchImpl} from '../../../utils/matrix/contentApiLocalProxy/resolveLineageContentApiFetchImpl';
import {resolveCtxPageUrl} from '../../../utils/matrix/pageUrl/index';
import {enrichSectionNavigationChildDescriptions, resolveHeaderHomeUrl, resolveSiteHeaderNavigation} from '../../../utils/matrix/siteLineage/index';
import {canResolveLineageNavigation} from './canResolveLineageNavigation';
import {lineageToNavbar} from './lineageToNavbar';
import {resolveDescriptionMetadataFieldKey, resolveNavigationLayout} from './resolveHeaderNavigationConfig';
import {isLocalDevRuntime} from './localDevRuntime';
import {resolvePreviewNavigationFromInput} from './resolvePreviewNavigationFromInput';
import {ensureLocalProjectEnvLoaded} from '../../../utils/loadProjectEnvFile';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types';
import type {NavbarMetadata, NavbarNavigationItem} from './navbarTypes';
import type {HeaderInput} from './types';

export interface ResolvedNavbarPayload {
    navigation: NavbarNavigationItem[];
    metadata: NavbarMetadata;
}

const DEFAULT_METADATA: NavbarMetadata = {
    alternativeColor: false,
    verticalOrientation: false,
    navbarBrandName: 'Menu',
};

function resolveLineageFetchImpl(info?: DxpComponentInfo): typeof fetch | undefined {
    return resolveLineageContentApiFetchImpl(info);
}

async function resolveLineageNavbarPayload(info?: DxpComponentInfo, input?: HeaderInput): Promise<ResolvedNavbarPayload> {
    const fetchImpl = resolveLineageFetchImpl(info);
    const siteRootAssetId = input?.siteRootAssetId?.trim() || undefined;

    let sectionNavigation = await resolveSiteHeaderNavigation(info, {
        fetchImpl,
        siteRootAssetId,
    });

    const navigationLayout = resolveNavigationLayout(input);
    const metadataFieldKey = resolveDescriptionMetadataFieldKey(input);

    if (navigationLayout === 'megaMenu' && metadataFieldKey && typeof fetchImpl === 'function') {
        sectionNavigation = await enrichSectionNavigationChildDescriptions(sectionNavigation, {
            metadataFieldKey,
            info,
            fetchImpl,
        });
    }

    const currentPageUrl = resolveCtxPageUrl(info);
    const navigation = lineageToNavbar(sectionNavigation, {
        currentPageUrl,
        homeUrl: resolveHeaderHomeUrl(info),
        navigationLayout,
    });

    return {
        navigation,
        metadata: DEFAULT_METADATA,
    };
}

/** Manifest preview JSON on `dev:dxp` — use fixture `previewNavigation`, not AMAPI/lineage. */
function shouldUseManifestPreviewNavigation(info?: DxpComponentInfo, input?: HeaderInput): boolean {
    if (!isLocalDevRuntime(info)) {
        return false;
    }
    return Boolean(resolvePreviewNavigationFromInput(input));
}

/**
 * Primary nav: local manifest previews use fixture `previewNavigation` on `input`.
 * Otherwise Matrix lineage when env allows, then preview fields, then empty nav.
 */
export async function resolveNavbarPayload(info?: DxpComponentInfo, input?: HeaderInput): Promise<ResolvedNavbarPayload> {
    ensureLocalProjectEnvLoaded(info);

    const preview = resolvePreviewNavigationFromInput(input);
    if (preview && shouldUseManifestPreviewNavigation(info, input)) {
        return {
            navigation: preview.navigation,
            metadata: preview.metadata,
        };
    }

    if (canResolveLineageNavigation(info)) {
        return resolveLineageNavbarPayload(info, input);
    }

    if (preview) {
        return {
            navigation: preview.navigation,
            metadata: preview.metadata,
        };
    }

    return {
        navigation: [],
        metadata: DEFAULT_METADATA,
    };
}
