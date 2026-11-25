import type {SquizImage} from '../types/squiz.ts';

export function squizImageSrc(image?: SquizImage | null): string | undefined {
    const url = image?.imageVariations?.original?.url?.trim();
    return url || undefined;
}

export function hasSquizImage(image?: SquizImage | null): boolean {
    return Boolean(squizImageSrc(image));
}

export function squizImageAlt(image?: SquizImage | null, fallback = ''): string {
    const alt = image?.alt?.trim();
    return alt || fallback;
}
