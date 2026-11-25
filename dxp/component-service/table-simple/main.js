/**
 * Table (Simple) component
 */
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
        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;

        const {tableSettings = {}, wrapperClasses, tableContent} = input || {};

        const {variantClass = 'default', striped = false, hover = false, customClass = ''} = tableSettings;

        const tableWrapperClass = ['table-responsive', 'qld-table', customClass].filter(Boolean).join(' ').trim();
        const tableClass = ['table', variantClass === 'dark' && 'table-dark', striped && 'table-striped', hover && 'table-hover'].filter(Boolean).join(' ').trim();

        if (!tableContent || !tableContent?.length) {
            return '';
        }

        const content = typeof tableContent === 'string' ? xssSafeContent(tableContent) : '';

        return html`<div class="${escapeAttribute(`${tableWrapperClass} ${wrapperClasses || ''}`.trim())}">
            <div class="${tableClass}" ${editMode ? 'data-sq-field="tableContent"' : ''}>${content}</div>
        </div>`;
    },
};
