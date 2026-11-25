/**
 * Inpage Alert component
 */

import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

const DEFAULT_ARIA_LABELS = {
    info: 'Information alert',
    success: 'Success alert',
    warning: 'Warning alert',
    error: 'Error or alert',
};

const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5', 'h6'];

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
    async main(input = {}, componentUtilities) {
        // context value to determine if the component is being edited
        const editMode = componentUtilities?.ctx?.editor || false;

        const {variantClass = 'info', heading, headingTag = 'h2', content, ariaLabel, wrapperClasses} = input || {};

        if (!heading && !content) {
            return '';
        }

        const variant = Object.hasOwn(DEFAULT_ARIA_LABELS, variantClass) ? variantClass : 'info';
        const classes = [`alert alert-${variant}`, wrapperClasses].filter(Boolean).join(' ');
        const label = ariaLabel || DEFAULT_ARIA_LABELS[variant];
        const tag = HEADING_TAGS.includes(headingTag) ? headingTag : 'h2';

        return html`
            <div class="${escapeAttribute(classes)}" role="alert" aria-label="${escapeAttribute(label)}">
                ${heading ? `<${tag} ${editMode ? 'data-sq-field="heading"' : ''} class="alert-heading">${xssSafeContent(heading)}</${tag}>` : ''}
                ${content ? html`<div ${editMode ? 'data-sq-field="content"' : ''}>${xssSafeContent(content)}</div>` : ''}
            </div>
        `;
    },
};
