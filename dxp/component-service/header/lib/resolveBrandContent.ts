import {hasSquizImage, squizImageSrc} from '../../../utils/squizImage';
import type {CoaLogoVariant} from '../../../utils/logo/renderCoaLogo';
import type {BrandLayout, HeaderInput, HeaderMainContent, SecondaryLockupType} from './types';

export interface ResolvedBrandContent {
    brandLayout: BrandLayout;
    brandClassNames: string;
    primaryCoa: CoaLogoVariant;
    primaryImage: HeaderMainContent['logo'];
    secondaryImage: HeaderMainContent['secondaryLogo'];
    siteTitle?: string;
    subline?: string;
}

function resolveSubBrandLockupType(mainContent: HeaderMainContent): SecondaryLockupType {
    if (mainContent.secondaryLockupType === 'text') {
        return 'text';
    }
    if (mainContent.secondaryLockupType === 'image') {
        return 'image';
    }
    if (mainContent.siteTitle?.trim()) {
        return 'text';
    }
    if (hasSquizImage(mainContent.secondaryLogo) && squizImageSrc(mainContent.secondaryLogo)) {
        return 'image';
    }
    return 'text';
}

function resolveSubBrandPrimaryCoa(mainContent: HeaderMainContent, input: HeaderInput, lockupType: SecondaryLockupType): CoaLogoVariant {
    if (lockupType === 'text' && mainContent.siteTitle?.trim()) {
        return 'coa-landscape-2lines';
    }
    if (input.hasDeliveringForQLDLogo) {
        return 'coa-delivering-for-qld';
    }
    return 'default';
}

function resolveFallbackPrimaryCoa(mainContent: HeaderMainContent, input: HeaderInput): CoaLogoVariant {
    if (mainContent.siteTitle?.trim()) {
        return 'coa-landscape-2lines';
    }
    if (input.hasDeliveringForQLDLogo) {
        return 'coa-delivering-for-qld';
    }
    return 'default';
}

/**
 * Normalises manifest mainContent for the active brand layout.
 * Stale logo/title values from other layouts are ignored at render time.
 */
export function resolveBrandContent(brandLayout: BrandLayout, input: HeaderInput, mainContent: HeaderMainContent): ResolvedBrandContent {
    const baseClass = 'qld-header-brand';

    switch (brandLayout) {
        case 'masterBrand':
            return {
                brandLayout,
                brandClassNames: baseClass,
                primaryCoa: 'coa-master-brand',
                primaryImage: undefined,
                secondaryImage: undefined,
                siteTitle: undefined,
                subline: undefined,
            };

        case 'subBrand': {
            const lockupType = resolveSubBrandLockupType(mainContent);
            const showText = lockupType === 'text';
            const showImage = lockupType === 'image';

            return {
                brandLayout,
                brandClassNames: baseClass,
                primaryCoa: resolveSubBrandPrimaryCoa(mainContent, input, lockupType),
                primaryImage: undefined,
                secondaryImage: showImage ? mainContent.secondaryLogo : undefined,
                siteTitle: showText ? mainContent.siteTitle : undefined,
                subline: showText ? mainContent.subline : undefined,
            };
        }

        case 'coBrand':
            return {
                brandLayout,
                brandClassNames: `${baseClass} qld-header-brand--co-brand`,
                primaryCoa: 'coa-landscape-2lines',
                primaryImage: undefined,
                secondaryImage: undefined,
                siteTitle: mainContent.siteTitle,
                subline: mainContent.subline,
            };

        case 'endorsedBrand': {
            const primaryImage = hasSquizImage(mainContent.logo) && squizImageSrc(mainContent.logo) ? mainContent.logo : undefined;

            return {
                brandLayout,
                brandClassNames: baseClass,
                primaryCoa: primaryImage ? 'default' : resolveFallbackPrimaryCoa(mainContent, input),
                primaryImage,
                secondaryImage: mainContent.secondaryLogo,
                siteTitle: mainContent.siteTitle,
                subline: mainContent.subline,
            };
        }

        case 'standaloneBrand': {
            const primaryImage = hasSquizImage(mainContent.logo) && squizImageSrc(mainContent.logo) ? mainContent.logo : undefined;

            return {
                brandLayout,
                brandClassNames: baseClass,
                primaryCoa: primaryImage ? 'default' : resolveFallbackPrimaryCoa(mainContent, input),
                primaryImage,
                secondaryImage: mainContent.secondaryLogo,
                siteTitle: mainContent.siteTitle,
                subline: mainContent.subline,
            };
        }
    }
}
