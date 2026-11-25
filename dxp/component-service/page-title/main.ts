/**
 * Page title (DXP Edge).
 *
 * Outputs the name of the page the component is placed on, wrapped in an `<h1>`.
 * The name is the Matrix site lineage asset whose id matches `ctx.assetId`.
 *
 * Preview: when nothing is placed, local dev, the editor and Storybook show the
 * mock name from `preview-title.json`. A live page with no placement renders nothing.
 */
import {html} from '../../utils/html.js';
import {resolveCtxAssetId} from '../../utils/matrix/pageUrl/index.js';
import {fetchSiteLineage} from '../../utils/matrix/siteLineage/fetchSiteLineage.js';
import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import {isLocalDevRuntime} from '../header/lib/localDevRuntime.js';
import previewTitle from './preview-title.json';

/**
 * Escape a value for HTML text.
 * The page name is plain text, so every special character is escaped.
 * xssSafeContent only filters tags, so it would still let an `<img>` through.
 */
function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Name of the placed page from site lineage, or "" when the asset is missing or the request fails. */
async function resolvePlacedPageName(info: DxpComponentInfo | undefined, assetId: string): Promise<string> {
    try {
        const lineage = await fetchSiteLineage(info, {
            expandSectionChildren: false,
        });
        const asset = lineage.assets?.find((item) => String(item.id) === assetId);
        return asset?.name?.trim() ?? '';
    } catch {
        return '';
    }
}

/** `<h1>` with the escaped name, or "" when there is no name. */
function renderTitle(name: string): string {
    return name ? html`<h1>${escapeHtml(name)}</h1>` : '';
}

export default {
    async main(_input: Record<string, never>, componentUtilities?: DxpComponentInfo): Promise<string> {
        const ctx = componentUtilities?.ctx;
        const editMode = typeof ctx === 'object' && ctx !== null && ctx.editor === true;

        const assetId = resolveCtxAssetId(componentUtilities);
        if (assetId) {
            return renderTitle(await resolvePlacedPageName(componentUtilities, assetId));
        }

        const previewMode = !componentUtilities || editMode || isLocalDevRuntime(componentUtilities);
        return previewMode ? renderTitle(previewTitle.name) : '';
    },
};
