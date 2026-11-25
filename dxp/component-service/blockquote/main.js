/**
 * Blockquote component
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
    async main(input, componentUtilities) {
        const {wrapperClasses, classes, citeUrl, content, citeText} = input || {};
        const editMode = componentUtilities?.ctx?.editor || false;
        const hasQuote = typeof content === 'string' && content.trim() !== '';

        // Live output has nothing to show without a quote. Edit mode keeps the markup
        // so the editor can type into it.
        if (!hasQuote && !editMode) {
            return '';
        }

        return html`
            <div class="${escapeAttribute(wrapperClasses)}">
                <figure class="blockquote ${escapeAttribute(classes)}">
                    <blockquote ${editMode ? `data-sq-field="content"` : ''} cite="${escapeAttribute(citeUrl)}">${xssSafeContent(content ?? '')}</blockquote>
                    ${
                        citeText || editMode
                            ? html`<figcaption ${editMode ? `data-sq-field="citeText"` : ''} class="quote-source">${xssSafeContent(citeText ?? '')}</figcaption>`
                            : ''
                    }
                </figure>
            </div>
        `;
    },
};
