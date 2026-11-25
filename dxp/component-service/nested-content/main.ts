/**
 * Nested content component (Pages mode).
 *
 * Embeds another Matrix asset's page content into the current page via an
 * ESI include. Page query params (excluding SQ_*) are forwarded so the
 * embedded content can use them.
 */
import {html} from '../../utils/html.js';
import type {NestedContentInfo, NestedContentInput} from './types.ts';

export const PAGES_QUERY = 'SQ_ASSET_CONTENTS_RAW&SQ_SESSION_MODE=read_only_async';

export function hasMatrixAssetSelection(matrixAsset: unknown): matrixAsset is string {
    return typeof matrixAsset === 'string' && matrixAsset.trim() !== '';
}

function appendQuery(assetUrl: string, query: string): string {
    const separator = assetUrl.includes('?') ? '&' : '?';
    return `${assetUrl}${separator}${query}`;
}

/**
 * Forward embedding-page query params onto the request URL, skipping Matrix
 * system params (SQ_*). Returns the request URL unchanged when there is
 * nothing to forward or the URLs cannot be parsed.
 */
export function mergePageSearchParams(requestUrl: string, pageHref?: string): string {
    if (!pageHref) {
        return requestUrl;
    }

    try {
        const pageUrl = new URL(pageHref);
        if ([...pageUrl.searchParams.keys()].length === 0) {
            return requestUrl;
        }

        const target = new URL(requestUrl, pageHref);
        for (const [key, value] of pageUrl.searchParams) {
            if (key.startsWith('SQ_')) {
                continue;
            }
            target.searchParams.set(key, value);
        }

        return target.href;
    } catch {
        return requestUrl;
    }
}

export function buildEsiInclude(assetUrl: string, pageHref?: string): string {
    const urlWithQuery = appendQuery(assetUrl, PAGES_QUERY);
    const src = mergePageSearchParams(urlWithQuery, pageHref);
    return `<esi:include src="${src}" />`;
}

/** Escape a value for safe use as HTML text content. */
function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderConfigurationError(matrixAsset: unknown): string {
    const assetUri = typeof matrixAsset === 'string' ? matrixAsset : '';
    return html`
        <p class="nested-content__error">
            Error with component configuration.<br />
            Unable to resolve a URL for the provided asset.<br />
            Asset URI: ${escapeHtmlText(assetUri)}
        </p>
    `;
}

/** Resolve a matrix-asset-uri to its public URL. Returns "" on any failure. */
export async function getAssetUrl(matrixAssetUri: unknown, info: NestedContentInfo): Promise<string> {
    if (!hasMatrixAssetSelection(matrixAssetUri)) {
        return '';
    }

    try {
        const matrixAsset = await info.fns?.resolveUri?.(matrixAssetUri);
        return matrixAsset?.url ?? '';
    } catch {
        return '';
    }
}

export default {
    async main(input: NestedContentInput | undefined, info: NestedContentInfo) {
        const matrixAsset = input?.matrixAsset;

        if (!hasMatrixAssetSelection(matrixAsset)) {
            return renderConfigurationError(matrixAsset);
        }

        const assetUrl = await getAssetUrl(matrixAsset, info);
        if (!assetUrl) {
            return renderConfigurationError(matrixAsset);
        }

        const ctx = typeof info.ctx === 'object' ? info.ctx : undefined;
        const pageHref = ctx?.url != null ? String(ctx.url) : undefined;

        return buildEsiInclude(assetUrl, pageHref);
    },
};
