import type {HeaderInput, NavigationLayout} from './types';

export function resolveNavigationLayout(input?: HeaderInput): NavigationLayout {
    return input?.navigation?.layout === 'megaMenu' ? 'megaMenu' : 'simpleList';
}

export function resolveDescriptionMetadataFieldKey(input?: HeaderInput): string | undefined {
    const key = input?.navigation?.descriptionMetadataFieldKey?.trim() || input?.navigation?.descriptionMetadataFieldAssetId?.trim();
    return key || undefined;
}
