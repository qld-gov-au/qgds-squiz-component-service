/**
 * Link component
 */
import {Link} from '../../utils/Link.js';
import {LinkList} from '../../utils/LinkList.js';
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

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

export default {
    async main(input) {
        const {variant = 'default', links: linksInput, wrapperClasses} = input || {};
        const links = Array.isArray(linksInput) ? linksInput : [];

        if (links.length === 0) {
            return '';
        }

        const output = links.length === 1 ? Link(links[0]) : LinkList(links);
        const wrapperClass = `${variant === 'dark' ? 'dark' : ''} ${xssSafeContent(wrapperClasses) || ''}`.trim();

        return html`<div class="${escapeAttribute(wrapperClass)}">${output}</div>`;
    },
};
