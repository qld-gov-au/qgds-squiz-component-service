/**
 * Tabs component
 * QGDS Bootstrap 5 tabs with optional section-tabs variant.
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import {squizLinkHref, squizLinkLabel} from '../../utils/squizLink.ts';
import {Cta} from '../../utils/Cta.js';

const escapeAttribute = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const safeAttribute = (value) => escapeAttribute(xssSafeContent(value));

function toCamelCase(str) {
    if (str == null || typeof str !== 'string') return '';
    return str
        .trim()
        .split(/\s+/)
        .map((word, i) =>
            i === 0
                ? word.toLowerCase().replace(/[^a-z0-9]/gi, '')
                : word.charAt(0).toUpperCase() +
                  word
                      .slice(1)
                      .toLowerCase()
                      .replace(/[^a-z0-9]/gi, ''),
        )
        .join('');
}

export default {
    async main(input) {
        const {tabsSettings = {}, items = [], wrapperClasses} = input || {};
        const typeVariant = tabsSettings?.typeVariant ?? 'default';
        const introSectionWrapperClasses = tabsSettings?.introSectionWrapperClasses ?? '';
        const variant = tabsSettings?.variant ?? 'default';
        const siblingSectionTitle = tabsSettings?.siblingSectionTitle ?? '';
        const siblingSectionContent = tabsSettings?.siblingSectionContent ?? '';
        const tabVariant = tabsSettings?.tabVariant ?? 'default';

        if (items.length === 0) {
            return '';
        }

        const random5 = String(Math.floor(10000 + Math.random() * 90000));
        const tabIds = items.map((item, i) => {
            const tabText = item?.tabText ?? '';
            const slug = toCamelCase(tabText) || `tab-${i}`;
            return {slug, paneId: `${slug}-${random5}-tab-pane`};
        });

        const isSectionTabs = typeVariant === 'section-tabs';
        const typeVariantClass = isSectionTabs ? 'section-tabs' : 'container-tabs';
        const variantClass = variant ? ` ${safeAttribute(variant)}` : ' default';
        const tabNavVariantClass = isSectionTabs ? ` ${safeAttribute(tabVariant)}` : '';
        const introSectionTabVariantClass = isSectionTabs ? ` ${safeAttribute(tabVariant)}` : '';

        // First non-disabled tab is active on load (so disabled tab 0 doesn't show its panel)
        const firstEnabledIndex = items.findIndex((item) => !item?.disabled);
        const activeIndex = firstEnabledIndex >= 0 ? firstEnabledIndex : 0;

        const introSection =
            isSectionTabs && (siblingSectionTitle || (siblingSectionContent && String(siblingSectionContent).trim()))
                ? html`<section class="${`container tab-content pb-5 pt-5 mb-0${introSectionTabVariantClass} ${safeAttribute(introSectionWrapperClasses) || ''}`.trim()}">
                      <div class="row" style="padding-inline: 2.5rem;">
                          ${siblingSectionTitle ? html`<h2>${xssSafeContent(siblingSectionTitle)}</h2>` : ''} ${siblingSectionContent ? xssSafeContent(siblingSectionContent) : ''}
                      </div>
                  </section>`
                : '';

        const navTabs = html`<ul class="nav nav-tabs${tabNavVariantClass}" role="tablist">
            ${items
                .map((item, i) => {
                    const tabText = item?.tabText ?? '';
                    const {slug, paneId} = tabIds[i];
                    const active = i === activeIndex;
                    const disabled = !!item?.disabled;
                    const icon = item?.icon ? String(item.icon).trim() : '';
                    return html`<li class="nav-item" role="presentation">
                        <button
                            class="nav-link ${active ? 'active' : ''}"
                            id="${safeAttribute(slug)}-tab"
                            data-bs-toggle="tab"
                            data-bs-target="#${safeAttribute(paneId)}"
                            type="button"
                            role="tab"
                            aria-controls="${safeAttribute(paneId)}"
                            aria-selected="${active ? 'true' : 'false'}"
                            ${disabled ? 'disabled' : ''}
                        >
                            <span> ${icon ? html`<i class="qld-icon qld-icon-md ${safeAttribute(icon)}"></i>` : ''}${xssSafeContent(tabText)} </span>
                        </button>
                    </li>`;
                })
                .join('')}
        </ul>`;

        const scrollLeft = html`<button class="scroll scroll-left" aria-hidden="true" aria-label="Scroll tab buttons left" tabindex="-1"><i></i></button>`;
        const scrollRight = html`<button class="scroll scroll-right" aria-hidden="true" aria-label="Scroll tab buttons right" tabindex="-1"><i></i></button>`;

        const headingTag = isSectionTabs ? 'h2' : 'h3';
        const tabPanels = items
            .map((item, i) => {
                const {slug, paneId} = tabIds[i];
                const active = i === activeIndex;
                const title = item?.title ?? '';
                const content = item?.content ?? '';
                const link = item?.hasCta ? item?.ctaLink : null;
                const ctaEl = link
                    ? Cta({
                          href: xssSafeContent(squizLinkHref(link)),
                          target: link.target,
                          label: xssSafeContent(squizLinkLabel(link, 'Call to action')),
                      })
                    : '';
                return html`<section
                    class="tab-pane fade ${active ? 'show active' : ''}"
                    id="${safeAttribute(paneId)}"
                    role="tabpanel"
                    aria-labelledby="${safeAttribute(slug)}-tab"
                    tabindex="0"
                >
                    ${title ? html`<${headingTag}>${xssSafeContent(title)}</${headingTag}>` : ''} ${content ? xssSafeContent(content) : ''}${ctaEl}
                </section>`;
            })
            .join('');

        const tabsSection = html`<section class="${`qld-tabs ${typeVariantClass}${variantClass} ${safeAttribute(wrapperClasses) || ''}`.trim()}">
            <div class="tabs-area container">${navTabs} ${scrollLeft} ${scrollRight}</div>
            <div class="tab-content container">${tabPanels}</div>
        </section>`;

        return `${introSection}${tabsSection}`;
    },
};
