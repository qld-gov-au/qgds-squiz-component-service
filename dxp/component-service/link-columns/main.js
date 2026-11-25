/**
 * Link columns component
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import {squizLinkHref, squizLinkLabel, hasSquizLinkContent} from '../../utils/squizLink.ts';
import {Cta} from '../../utils/Cta.js';

function renderLinkItem(link) {
    if (!link) return '';
    const href = xssSafeContent(squizLinkHref(link));
    const text = xssSafeContent(squizLinkLabel(link));
    const target = link.target;
    const targetAttr = target ? ` target="${xssSafeContent(target)}"` : '';
    return html`<li class="nav-item">
        <a class="nav-link" href="${href}" ${targetAttr}>${text}</a>
    </li>`;
}

export default {
    async main(input) {
        const {id: sectionId, theme = 'default', links: linksInput, wrapperClasses, linkColumnSettings} = input || {};

        const settings = linkColumnSettings ?? {};

        const {itemsFlowVert = true, viewAllButton = true, viewAllLink} = settings;

        const links = Array.isArray(linksInput) ? linksInput : [];
        const validLinks = links.filter((link) => hasSquizLinkContent(link));

        if (validLinks.length === 0) {
            return '';
        }

        const idAttr = sectionId?.trim() ? ` id="${xssSafeContent(sectionId.trim())}"` : '';
        const themeClass = theme && theme !== 'default' ? ` ${xssSafeContent(theme)}` : '';
        const sectionClass = `link-column${themeClass}`;
        const ulClass = itemsFlowVert ? 'nav col-vert-3' : 'nav col-3';
        const items = validLinks.map((link) => renderLinkItem(link)).join('');

        let viewAllLi = '';
        if (viewAllButton && viewAllLink) {
            // Cta escapes href/target itself; only the label needs escaping here.
            viewAllLi = html`<li class="nav-item all-link">
                ${Cta({
                    href: squizLinkHref(viewAllLink),
                    target: viewAllLink.target,
                    label: xssSafeContent(squizLinkLabel(viewAllLink, 'View all')),
                    className: 'view-all',
                })}
            </li>`;
        }

        return html`
            <section class="${`${sectionClass} ${xssSafeContent(wrapperClasses) || ''}`.trim()}" ${idAttr}>
                <ul class="${ulClass}">
                    ${items}${viewAllLi}
                </ul>
            </section>
        `;
    },
};
