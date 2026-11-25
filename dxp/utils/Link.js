import {html} from './html.js';
import {xssSafeContent} from './xss.js';
import {squizLinkHref, squizLinkLabel} from './squizLink.ts';

/**
 * Escape a value for a double-quoted HTML attribute.
 * xssSafeContent filters tags only, so it does not stop a quote from closing an attribute.
 */
function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function Link(item) {
    const {link: linkData, id: customId, ariaLabel, iconClass, iconPosition = 'leading', download} = item || {};

    if (!linkData) return '';

    const href = escapeAttribute(xssSafeContent(squizLinkHref(linkData)));
    const text = xssSafeContent(squizLinkLabel(linkData));
    const target = linkData.target;
    const ariaLabelValue = ariaLabel?.trim() || text || '';
    const targetAttr = ` target="${escapeAttribute(xssSafeContent(target))}"`;
    const ariaLabelAttr = ariaLabelValue ? ` aria-label="${escapeAttribute(xssSafeContent(ariaLabelValue))}"` : '';
    const idAttr = customId?.trim() ? ` id="${escapeAttribute(xssSafeContent(customId.trim()))}"` : '';
    const downloadAttr = download?.trim() ? ` download="${escapeAttribute(xssSafeContent(download.trim()))}"` : '';

    const iconSpan = iconClass?.trim()
        ? html`<span class="qld-icon qld-icon-md ${escapeAttribute(xssSafeContent(iconClass.trim()))} ${escapeAttribute(iconPosition)}" aria-hidden="true"></span>`
        : '';

    return html`
        <a class="link" ${idAttr} href="${href}" ${targetAttr}${ariaLabelAttr}${downloadAttr}>
            ${iconPosition === 'leading' ? iconSpan : ''} ${text} ${iconPosition === 'trailing' ? iconSpan : ''}
        </a>
    `;
}
