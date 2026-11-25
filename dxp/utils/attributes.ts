import type {SquizLink} from '../types/squiz.ts';
import {squizLinkHref} from './squizLink.js';

/** Schemes that must never be rendered into an href. */
const UNSAFE_SCHEME = /^\s*(javascript|vbscript|data):/i;

/** Escape a value for use inside a double-quoted HTML attribute. */
export function escapeAttribute(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Return a trimmed URL, or the fallback when empty or unsafe. */
export function safeUrl(value: string | undefined, fallback = '#'): string {
    const trimmed = (value ?? '').trim();
    if (!trimmed || UNSAFE_SCHEME.test(trimmed)) {
        return fallback;
    }
    return trimmed;
}

/** Escaped `href` value for a SquizLink (resolved), with a safe fallback. */
export function linkHref(link?: SquizLink | null, fallback = '#'): string {
    return escapeAttribute(safeUrl(squizLinkHref(link, fallback), fallback));
}

/**
 * True when `linkHref` would render a real destination: not empty, not an unsafe scheme.
 * An asset pick with no URL is false, so a component can drop the link instead of
 * rendering `href="#"`.
 */
export function hasSafeLinkUrl(link?: SquizLink | null): boolean {
    return safeUrl(squizLinkHref(link, ''), '') !== '';
}

/** Optional ` target="…"` attribute for a SquizLink. */
export function linkTargetAttribute(link?: SquizLink | null): string {
    const target = link?.target?.trim();
    return target ? ` target="${escapeAttribute(target)}"` : '';
}

/** Inline editor attribute (` data-sq-field="…"`) when the component is in edit mode. */
export function editorSqField(editMode: boolean, fieldPath: string): string {
    return editMode ? ` data-sq-field="${escapeAttribute(fieldPath)}"` : '';
}
