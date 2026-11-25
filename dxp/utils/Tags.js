import {html} from './html.js';
import {xssSafeContent} from './xss.js';

const VARIANT_CLASS = {
    default: 'tag-default',
    light: 'tag-light',
    alt: 'tag-alt',
    dark: 'tag-dark',
    dark_alt: 'tag-dark-alt',
    status: 'tag-status',
};

function TagItem(item, emphasis, variant) {
    if (!item) return '';
    const content = xssSafeContent(String(item.content ?? ''));
    const sizeClass = item.size === 'large' ? 'tag-large' : '';
    const emphasisClass = emphasis === 'tag-high' ? 'tag-high' : 'tag-low';
    const itemClass = variant === 'status' ? (item.statusClasses ?? 'tag-neutral') : item.classes && item.classes !== 'default' ? item.classes : '';
    const itemClasses = ['tag-item', itemClass, sizeClass, emphasisClass].filter(Boolean).join(' ').trim();
    const clearButton = item.appliedFilter === true ? html`<button class="tag-clear-filter-button" aria-label="Remove"></button>` : '';
    return html`<li class="${itemClasses}">${content}${clearButton}</li>`;
}

export function Tags(input) {
    const {variant = 'default', classes: listClasses = 'p-4 my-2', emphasis = 'tag-low', tagItems: tagItemsInput = []} = input || {};

    const tagItems = Array.isArray(tagItemsInput) ? tagItemsInput : [];

    if (tagItems.length === 0) {
        return '';
    }

    const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.default;
    const listClass = ['tag-list', variantClass, listClasses].filter(Boolean).join(' ').trim();

    const items = tagItems.map((item) => TagItem(item, emphasis, variant)).join('');

    return html`<ul class="${listClass}">
        ${items}
    </ul>`;
}
