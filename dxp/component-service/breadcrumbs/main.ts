/**
 * Breadcrumbs (DXP Edge).
 *
 * Builds the trail for the page the component is placed on from Matrix site
 * lineage. Markup matches `breadcrumbs.hbs`. The collapse control is added
 * client-side by `initBreadcrumb()` in `qld.bootstrap.js`.
 */
import {html} from '../../utils/html.js';
import {resolveCtxAssetId, resolveCtxPageUrl} from '../../utils/matrix/pageUrl/index.js';
import {resolveBreadcrumbs} from '../../utils/matrix/siteLineage/resolveBreadcrumbs.js';
import type {BreadcrumbItem, DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import {isLocalDevRuntime} from '../header/lib/localDevRuntime.js';
import previewTrail from './preview-trail.json';
import type {BreadcrumbsInput} from './types.js';

/**
 * Escape a value for HTML text or a double-quoted attribute.
 * xssSafeContent filters tags only, so it does not stop a quote from closing an attribute.
 */
function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderItem(item: BreadcrumbItem, isCurrent: boolean): string {
    const title = escapeHtml(item.title);

    if (isCurrent) {
        return `<li class="breadcrumb-item active" aria-current="page">${title}</li>`;
    }

    return `<li class="breadcrumb-item"><a href="${escapeHtml(item.url)}">${title}</a></li>`;
}

export default {
    async main(input: BreadcrumbsInput = {}, componentUtilities?: DxpComponentInfo): Promise<string> {
        const ctx = componentUtilities?.ctx;
        const editMode = Boolean(typeof ctx === 'object' && ctx?.editor);
        // Local dev (`dev:dxp`, IS_LOCAL) shows the same preview trail as the editor.
        const previewMode = editMode || isLocalDevRuntime(componentUtilities);
        const placed = Boolean(resolveCtxAssetId(componentUtilities) || resolveCtxPageUrl(componentUtilities));

        // A live page with no placement context shows nothing. Storybook (no
        // utilities), the editor and local dev fall through to the preview trail.
        if (componentUtilities && !placed && !previewMode) {
            return '';
        }

        const breadcrumbs = await resolveBreadcrumbs(componentUtilities, {
            previewItems: previewTrail as BreadcrumbItem[],
        });
        if (breadcrumbs.length === 0) {
            return '';
        }

        const classes = input.wrapperClasses?.trim() ?? '';
        const navOpen = classes ? `<nav aria-label="breadcrumb" class="${escapeHtml(classes)}">` : `<nav aria-label="breadcrumb">`;
        const items = breadcrumbs.map((item, index) => renderItem(item, index === breadcrumbs.length - 1)).join('');
        const list = `<ol class="breadcrumb">${items}</ol>`;

        return html`${navOpen}${list}</nav>`;
    },
};
