import {xssSafeContent} from '../xss.js';
import {coaDeliveringRaw, coaLandscape2LinesRaw, coaLandscapeRaw, coaMasterBrandRaw} from './coaLogoSvgStrings';

export type CoaLogoVariant = 'coa-landscape' | 'coa-landscape-2lines' | 'coa-delivering-for-qld' | 'coa-master-brand' | 'default';

export interface RenderCoaLogoOptions {
    logo?: CoaLogoVariant | 'default';
    className?: string;
    height?: number | string;
    width?: number | string;
    fill?: string;
}

const RAW_BY_VARIANT: Record<CoaLogoVariant, string> = {
    'coa-landscape': coaLandscapeRaw,
    'coa-landscape-2lines': coaLandscape2LinesRaw,
    'coa-delivering-for-qld': coaDeliveringRaw,
    'coa-master-brand': coaMasterBrandRaw,
    default: coaLandscapeRaw,
};

function compileLogoSvg(raw: string, options: RenderCoaLogoOptions): string {
    const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch?.[1] ?? '0 0 324 56';
    const attrs = ['xmlns="http://www.w3.org/2000/svg"', `viewBox="${viewBox}"`];

    if (options.className) {
        attrs.push(`class="${xssSafeContent(options.className)}"`);
    }
    if (options.fill) {
        attrs.push(`fill="${xssSafeContent(options.fill)}"`);
    }
    if (options.width !== undefined && options.width !== '') {
        attrs.push(`width="${xssSafeContent(String(options.width))}"`);
    }
    if (options.height !== undefined && options.height !== '') {
        attrs.push(`height="${xssSafeContent(String(options.height))}"`);
    }

    const innerMatch = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    const inner = innerMatch?.[1] ?? '';

    return `<svg ${attrs.join(' ')}>${inner}</svg>`;
}

/** Inline COA SVG markup from `src/images/logos/*.svg`. */
export function renderCoaLogo(options: RenderCoaLogoOptions = {}): string {
    const variant = options.logo && options.logo !== 'default' ? options.logo : 'default';
    const raw = RAW_BY_VARIANT[variant] ?? RAW_BY_VARIANT.default;
    return compileLogoSvg(raw, options);
}
