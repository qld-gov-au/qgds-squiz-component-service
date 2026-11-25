import {html} from '../../html.js';
import {xssSafeContent} from '../../xss.js';
import {squizLinkLabel} from '../../squizLink.ts';

import {LinkList} from '../../LinkList.js';
import {Cta} from '../../Cta.js';
import {Tags} from '../../Tags.js';
import {escapeAttribute, safeTarget, safeUrl} from './attributes.js';

const LINKS_VARIANT = {
    DEFAULT: 'default',
    TAGS: 'tags',
};

/**
 * Return a link with a safe URL and target, or null when it has no safe URL.
 * Values are NOT escaped here: the kernel Link and Cta helpers escape their own
 * attributes, so escaping again would double-encode. Only the Tags markup, which
 * is built by hand in transformLinksToTags, escapes its own values.
 */
function toSafeLink(link) {
    const href = safeUrl(link?.url);
    if (!href) {
        return null;
    }

    return {
        url: href,
        text: squizLinkLabel(link),
        target: safeTarget(link?.target),
    };
}

function transformLinksToTags(items) {
    return items.map(({link}) => ({
        content: `<a href="${escapeAttribute(link.url)}" target="${escapeAttribute(link.target || '_self')}">${escapeAttribute(link.text)}</a>`,
        classes: 'tag-link',
    }));
}

function FooterLinks(variant, items) {
    const safeItems = (items || [])
        .map((item) => {
            const link = toSafeLink(item?.link);
            return link ? {...item, link} : null;
        })
        .filter(Boolean);

    if (!safeItems.length) {
        return '';
    }

    if (variant === LINKS_VARIANT.TAGS) {
        return Tags({
            tagItems: transformLinksToTags(safeItems),
            classes: '',
        });
    }

    return LinkList(safeItems);
}

export function Footer(footer, editMode, index) {
    const {content, enabled, cta, links} = footer;

    if (!enabled) {
        return '';
    }

    const safeCta = toSafeLink(cta);
    const linksHtml = FooterLinks(links?.variant, links?.items);

    // Keep the footer target in edit mode so an editor can add footer content.
    if (!editMode && !content && !safeCta && !linksHtml) {
        return '';
    }

    const footerEditAttr = editMode ? `data-sq-field="cards[${index}].footer.content"` : '';

    return html`
        <div class="card-footer">
            <div ${footerEditAttr}>${xssSafeContent(content || '')}</div>
            ${
                safeCta
                    ? Cta({
                          href: safeCta.url,
                          target: safeCta.target,
                          // Cta does not escape the label; the href, target and aria-label it escapes itself.
                          label: escapeAttribute(safeCta.text),
                          ariaLabel: safeCta.text,
                      })
                    : ''
            }
            ${linksHtml}
        </div>
    `;
}
