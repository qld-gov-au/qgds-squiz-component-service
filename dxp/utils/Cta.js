import {html} from './html.js';

/**
 * Escape a value for a double-quoted HTML attribute.
 */
function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export const Cta = ({className, id, href, target, label, ariaLabel}) => {
    if (!href) {
        return '';
    }

    const idAttr = id ? `id="${escapeAttribute(id)}"` : '';
    const targetAttr = target ? `target="${escapeAttribute(target)}"` : '';

    const optionalAttrs = [idAttr, targetAttr].filter(Boolean).join(' ');

    return html`
        <a class="qld-cta-link ${escapeAttribute(className || '')}" href="${escapeAttribute(href)}" aria-label="${escapeAttribute(ariaLabel || label)}" ${optionalAttrs}>
            ${label}
            <span class="icon" aria-hidden="true"></span>
        </a>
    `;
};
