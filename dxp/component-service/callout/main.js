/**
 * Callout component
 */

// Shared HTML template tag and XSS filter (see docs/CODING_STANDARDS.md).
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
        const {wrapperClasses, variant, title, content} = input || {};
        const classes = [variant, wrapperClasses].filter(Boolean).join(' ');

        return html`
            <div class="${escapeAttribute(classes)}">
                <div class="callout">
                    ${title ? html`<h3 data-sq-field="title" class="callout-title">${xssSafeContent(title)}</h3>` : ''}
                    <div data-sq-field="content" class="callout-text">${xssSafeContent(content ?? '')}</div>
                </div>
            </div>
        `;
    },
};
