/**
 * Back to top component
 * Based on backToTop.hbs. Scroll-to-top behaviour is in backToTop.functions.js (registered in qld.bootstrap.js).
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import {DirectionLink} from '../../utils/DirectionLink.js';
import getClasses from '../../utils/classes.js';

const POSITION = {
    LEFT: 'left',
    RIGHT: 'right',
};

// Matches the Handlebars defaults (backToTop.hbs).
const DEFAULT_LABEL = 'Back to top';
const DEFAULT_HREF = '#';

// Browsers ignore tabs, newlines and other control characters inside a scheme,
// so strip them before checking for script-capable schemes.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F\s]/g;
const UNSAFE_SCHEME = /^(javascript|data|vbscript):/;

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 *
 * @param {string} value - Raw value.
 * @returns {string} Escaped value.
 */
function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Return a safe, escaped href. Script-capable schemes fall back to "#".
 *
 * @param {unknown} href - Author-entered href.
 * @returns {string} Escaped href for use in an attribute.
 */
function safeHref(href) {
    const value = typeof href === 'string' ? href.trim() : '';
    if (!value) {
        return DEFAULT_HREF;
    }
    if (UNSAFE_SCHEME.test(value.replace(CONTROL_CHARS, '').toLowerCase())) {
        return DEFAULT_HREF;
    }
    return escapeAttribute(value);
}

export default {
    async main(input, componentUtilities) {
        const {label, href, position, wrapperClasses} = input || {};

        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;

        const labelText = typeof label === 'string' && label.trim() ? label : DEFAULT_LABEL;
        const safeLabel = xssSafeContent(labelText);
        const editableLabel = editMode ? html`<span data-sq-field="label">${safeLabel}</span>` : safeLabel;

        const className = getClasses({
            up: true,
            'ms-auto': position === POSITION.RIGHT,
        });

        const link = DirectionLink({
            label: editableLabel,
            href: safeHref(href),
            className,
        });

        const linkWrapper = html`<div class="back-to-top d-print-none">${link}</div>`;

        // Only add the outer wrapper when classes are set, so the default markup matches backToTop.hbs.
        const wrapperClassList = typeof wrapperClasses === 'string' ? wrapperClasses.trim() : '';
        if (!wrapperClassList) {
            return linkWrapper;
        }

        return html`<div class="${escapeAttribute(wrapperClassList)}">${linkWrapper}</div>`;
    },
};
