import {html} from './html.js';
import {Link} from './Link.js';

export function LinkList(links) {
    if (!links?.length) {
        return '';
    }

    const items = links
        .filter((item) => item?.link)
        .map((item) => html`<li class="link-item">${Link(item)}</li>`)
        .join('');

    if (!items) {
        return '';
    }

    return html`<ul class="link-list">
        ${items}
    </ul>`;
}
