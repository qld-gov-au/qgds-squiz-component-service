import type {SquizLink} from '../../../types/squiz.js';
import {hasSquizLinkContent, squizLinkHref, squizLinkLabel} from '../../../utils/squizLink.js';

/** Master-brand pre-header when `preHeader.globalLink` is wholly unset. */
export const MASTER_BRAND_GLOBAL_LINK_URL = 'https://qld.gov.au';
export const MASTER_BRAND_GLOBAL_LINK_TEXT = 'qld.gov.au';

/**
 * Resolve pre-header global link display from author SquizLink input.
 * Master-brand defaults apply only when the field is unset (no url and no text).
 * When the author sets text or url, those values are used; missing url does not
 * fall back to the master-brand URL (avoids masking dev-ui / Matrix payload gaps).
 */
export function resolvePreHeaderGlobalLink(link: SquizLink | null | undefined): {url: string; text: string} {
    if (!hasSquizLinkContent(link)) {
        return {
            url: MASTER_BRAND_GLOBAL_LINK_URL,
            text: MASTER_BRAND_GLOBAL_LINK_TEXT,
        };
    }

    return {
        url: squizLinkHref(link, '#'),
        text: squizLinkLabel(link, ''),
    };
}
