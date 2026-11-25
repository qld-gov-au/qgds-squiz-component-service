import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import {resolveFooterSquizLinks} from './lib/resolveFooterSquizLinks.js';
import {renderFooter} from './lib/renderFooter.js';
import type {FooterInput} from './types.js';

/** Inline editing is enabled only when Matrix sets `ctx.editor`. */
function isEditMode(info?: DxpComponentInfo): boolean {
    const ctx = info?.ctx;
    return typeof ctx === 'object' && Boolean(ctx?.editor);
}

export default {
    async main(input: FooterInput = {}, info?: DxpComponentInfo) {
        const resolved = await resolveFooterSquizLinks(input, info);
        return renderFooter(resolved, isEditMode(info));
    },
};
