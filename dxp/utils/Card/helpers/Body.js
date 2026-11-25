import {html} from '../../html.js';
import {xssSafeContent} from '../../xss.js';

import {Heading} from './Heading.js';

function DateField(date, editMode, index) {
    // Keep the date target in edit mode so an editor can add a date.
    if (!date && !editMode) {
        return '';
    }

    const dateEditAttr = editMode ? `data-sq-field="cards[${index}].body.date"` : '';

    return html`<div class="card-date" ${dateEditAttr}>${xssSafeContent(date || '')}</div>`;
}

function Content(content, editMode, index) {
    // Keep the content target in edit mode so an editor can write content.
    if (!content && !editMode) {
        return '';
    }

    const contentEditAttr = editMode ? `data-sq-field="cards[${index}].body.content"` : '';

    return html`<div ${contentEditAttr} class="card-text">${xssSafeContent(content || '')}</div>`;
}

export function Body(settings, heading, body, editMode, index) {
    const {date, content} = body;
    const {action, isArrowVisible} = settings;

    return html`
        <div class="card-body">${DateField(date, editMode, index)} ${Heading(heading || {}, action, editMode, index, isArrowVisible)} ${Content(content, editMode, index)}</div>
    `;
}
