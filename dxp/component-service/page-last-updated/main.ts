/**
 * Page last updated (DXP Edge).
 *
 * Outputs the page's last updated date in the `qld-content-dates` markup, for example
 * `31 January 1900`. The date is `updated.date` from the Content API asset for the id
 * matching `ctx.assetId`. The raw asset JSON is read directly, because the shared lineage
 * mapper does not keep the `updated` field.
 *
 * Not editable: there are no CMS fields and no `data-sq-field` attributes. The output
 * is built from the parsed date parts only, so no escaping is needed.
 *
 * Preview: when nothing is placed, local dev, the editor and Storybook show the mock
 * date from `preview-last-updated.json`. A live page with no placement renders nothing.
 */
import {html} from '../../utils/html.js';
import {resolveLineageContentApiFetchImpl} from '../../utils/matrix/contentApiLocalProxy/resolveLineageContentApiFetchImpl.js';
import {resolveContentApiUrlResolutionBase, resolveCtxAssetId} from '../../utils/matrix/pageUrl/index.js';
import {buildLineageAssetContentApiUrl, buildSiteLineageFetchHeaders} from '../../utils/matrix/siteLineage/fetchSiteLineage.js';
import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import {siteLineageLog} from '../../utils/matrix/siteLineage/siteLineageLog.js';
import {isLocalDevRuntime} from '../header/lib/localDevRuntime.js';
import {formatLastUpdated} from './formatLastUpdated.js';
import previewLastUpdated from './preview-last-updated.json';

/** Label for this component's lines in the site lineage log. */
const LOG_LABEL = 'Page last updated';

/** Date markup, or "" when there is no date to show. */
function renderLastUpdated(date: string): string {
    if (!date) return '';
    // Kept on one line so the output matches the design system markup exactly.
    // prettier-ignore
    return html`<dl class="qld-content-dates my-0"><dt class="my-0">Last updated:</dt><dd class="my-0">${date}</dd></dl>`;
}

/** Content API asset payload, reduced to the field this component reads. */
type LastUpdatedAssetPayload = {updated?: {date?: unknown}};

/**
 * Formatted `updated.date` for the placed page, or "" when it is missing or the request fails.
 * Fetches the default asset response (no `data` parameter), so `updated` is present.
 */
async function resolvePlacedPageLastUpdated(info: DxpComponentInfo | undefined, assetId: string): Promise<string> {
    try {
        // Wrap the global fetch: calling a fetch reference through an options object fails in some browsers.
        const fetchImpl = resolveLineageContentApiFetchImpl(info) ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));
        const endpoint = buildLineageAssetContentApiUrl(info, assetId, {
            urlResolutionBase: resolveContentApiUrlResolutionBase(info),
        });
        const headers = buildSiteLineageFetchHeaders(info, {contentApi: true});

        siteLineageLog(LOG_LABEL, 'asset request', {assetId, endpoint});
        const response = await fetchImpl(endpoint, {headers});
        siteLineageLog(LOG_LABEL, 'asset response', {
            assetId,
            status: response.status,
            ok: response.ok,
        });
        if (!response.ok) {
            return '';
        }

        const asset = (await response.json()) as LastUpdatedAssetPayload;
        return formatLastUpdated(asset.updated?.date);
    } catch {
        return '';
    }
}

export default {
    async main(_input: Record<string, never>, componentUtilities?: DxpComponentInfo): Promise<string> {
        const ctx = componentUtilities?.ctx;
        const editMode = typeof ctx === 'object' && ctx !== null && ctx.editor === true;

        const assetId = resolveCtxAssetId(componentUtilities);
        if (assetId) {
            return renderLastUpdated(await resolvePlacedPageLastUpdated(componentUtilities, assetId));
        }

        const previewMode = !componentUtilities || editMode || isLocalDevRuntime(componentUtilities);
        return previewMode ? renderLastUpdated(formatLastUpdated(previewLastUpdated.lastUpdated)) : '';
    },
};
