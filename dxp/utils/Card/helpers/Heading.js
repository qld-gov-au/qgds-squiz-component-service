import {html} from '../../html.js';
import {xssSafeContent} from '../../xss.js';
import {squizLinkLabel} from '../../squizLink.ts';
import {escapeAttribute, safeTarget, safeUrl} from './attributes.js';

const CARD_ACTIONS = {
    NO_ACTION: 'none',
    SINGLE: 'single',
    MULTI: 'multi',
};

export const ACTION_CLASS_MAP = {
    none: 'no',
    single: 'single',
    multi: 'multi',
};

// Matches the manifest enum for headingTag. Anything else falls back to h3.
const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5', 'h6'];

function headingTagName(headingTag) {
    return HEADING_TAGS.includes(headingTag) ? headingTag : 'h3';
}

function HeadingTitle(link, action, title, editMode, index) {
    const href = safeUrl(link?.url);

    // No safe URL: render the title as plain text, without a link.
    if (!href) {
        return xssSafeContent(title || '');
    }

    const target = safeTarget(link?.target);
    const attrs = [
        action === CARD_ACTIONS.SINGLE ? 'class="stretched-link"' : '',
        target ? `target="${escapeAttribute(target)}"` : '',
        editMode ? `data-sq-field="cards[${index}].heading.link"` : '',
    ]
        .filter(Boolean)
        .join(' ');

    return html`<a href="${escapeAttribute(href)}" ${attrs}>${xssSafeContent(title || squizLinkLabel(link))}</a>`;
}

function Arrow(isArrowVisible) {
    if (!isArrowVisible) {
        return '';
    }

    return html`<div class="qld-icon qld-icon-md qld-icon-arrow-right"></div>`;
}

export function Heading(heading, action, editMode, index, isArrowVisible) {
    const {headingTag, link, title} = heading;
    const tag = headingTagName(headingTag);
    const titleEditAttr = editMode ? `data-sq-field="cards[${index}].heading.title"` : '';

    return html`
        <${tag} ${titleEditAttr} class="card-title">
            ${HeadingTitle(link, action, title, editMode, index)}
            ${Arrow(isArrowVisible)}
        </${tag}>
    `;
}
