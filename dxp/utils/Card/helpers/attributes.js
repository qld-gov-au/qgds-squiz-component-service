/**
 * Attribute and URL helpers for the shared Card helpers.
 *
 * The `html` helper (String.raw) does not escape interpolations, and
 * xssSafeContent only filters tags. Attribute values therefore need
 * these helpers before they are interpolated.
 */

/** Escape a value for a double-quoted attribute or a text node. */
export function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_SCHEME_PATTERN = /^(https?|mailto|tel):/i;

/**
 * Return the URL when it is safe for an href, or "" when it is not.
 * Allows http(s), mailto, tel, and relative or anchor URLs.
 */
export function safeUrl(url) {
    const value = String(url ?? '').trim();
    if (!value) {
        return '';
    }

    // Browsers ignore control characters and whitespace inside a scheme,
    // so strip them before checking.
    // eslint-disable-next-line no-control-regex
    const probe = value.replace(/[\u0000-\u0020\u007f]/g, '');
    if (SCHEME_PATTERN.test(probe) && !SAFE_SCHEME_PATTERN.test(probe)) {
        return '';
    }

    return value;
}

const TARGET_PATTERN = /^[a-z0-9_-]+$/i;

/** Return the window target when it is a plain token, or "" when it is not. */
export function safeTarget(target) {
    const value = String(target ?? '').trim();
    return TARGET_PATTERN.test(value) ? value : '';
}

/**
 * Build a CSS url() value with a quoted and CSS-escaped URL.
 * Pass the result through escapeAttribute when it goes into an attribute.
 */
export function cssUrl(url) {
    const value = String(url ?? '').replace(/[\\"\n\r\f]/g, (char) => `\\${char.codePointAt(0).toString(16)} `);
    return `url("${value}")`;
}
