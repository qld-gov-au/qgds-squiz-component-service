import {html} from './html.js';

export const DirectionLink = ({className, id, href, target, label, ariaLabel}) => {
    const idAttr = id ? `id="${id}"` : '';
    const targetAttr = target ? `target="${target}"` : '';
    const ariaLabelAttr = ariaLabel ? `aria-label="${ariaLabel}"` : '';

    const optionalAttrs = [idAttr, targetAttr, ariaLabelAttr].filter(Boolean).join(' ');

    return html`
        <a class="qld-dir-link ${className || ''}" href="${href}" ${optionalAttrs}>
            ${label}
            <span class="qld-icon qld-icon-md qld-icon-arrow-${className}" aria-hidden="true"></span>
        </a>
    `;
};
