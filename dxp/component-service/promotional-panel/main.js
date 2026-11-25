import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import {squizLinkHref, squizLinkLabel} from '../../utils/squizLink.ts';

function renderCtaItem(item, idx) {
    const linkLabel = squizLinkLabel(item.link);
    return html`
        <a
            data-sq-field="ctaItems[${idx}].link"
            data-qa="cta-item"
            class="qld-cta-link"
            target="${xssSafeContent(item.link.target)}"
            href="${xssSafeContent(squizLinkHref(item.link))}"
            aria-label="${xssSafeContent(linkLabel)}"
            >${xssSafeContent(linkLabel)}<span class="icon" aria-hidden="true"></span
        ></a>
    `;
}

function renderBtnItem(item, idx) {
    const linkLabel = squizLinkLabel(item.link);
    return html`
        <a
            data-sq-field="btnItems[${idx}].link"
            class="btn ${item.variantClass}"
            target="${xssSafeContent(item.link.target)}"
            href="${xssSafeContent(squizLinkHref(item.link))}"
            aria-label="${xssSafeContent(linkLabel)}"
            ><span class="btn-label-default">${xssSafeContent(linkLabel)}</span><span class="btn-label-progress"></span
        ></a>
    `;
}

/**
 * Promotional Panel component
 */
export default {
    async main(input) {
        const {type, variantClass, promoImageField, contentAlignment, icon, title, abstract, body, ctaItems, btnItems, wrapperClasses} = input || {};

        const {imageSource = 'squizImage', squizImageField, src: customSrc, alt: customAlt = ''} = promoImageField || {};

        const original = squizImageField?.imageVariations?.original;
        const src = imageSource === 'squizImage' && original?.url ? original.url : customSrc;
        const alt = imageSource === 'squizImage' && squizImageField?.alt != null ? squizImageField.alt : customAlt;

        const isTypeIndent = type === 'indent-text' || type === 'indent-img';

        return html` <section class="qld-promo-panel ${type} ${isTypeIndent ? 'indent' : ''} ${xssSafeContent(wrapperClasses) || ''}">
            <div class="row ${type === 'promo' ? 'bg-img' : variantClass} ${contentAlignment}" ${type === 'promo' ? `style="background-image: url(${src});"` : ''}>
                <div class="image-panel" data-sq-field="promoImageField">
                    ${type !== 'promo' ? `<img class="promo-panel-image" src="${xssSafeContent(src)}" alt="${xssSafeContent(alt)}">` : ''}
                </div>
                <div class="content-panel ${variantClass}" data-sq-field="variantClass">
                    ${
                        icon !== 'none'
                            ? html`
                                  <div class="icon-container">
                                      <div class="icon-body">
                                          <i class="qld-icon ${icon}"></i>
                                      </div>
                                  </div>
                              `
                            : ''
                    }
                    <div class="main">
                        ${html`<h2 data-sq-field="title">${xssSafeContent(title)}</h2>
                            ${abstract ? html`<div class="promo-abstract" data-sq-field="abstract">${xssSafeContent(abstract)}</div>` : ''}
                            <span data-sq-field="body">${xssSafeContent(body)}</span>`}
                    </div>
                    ${ctaItems?.length ? html`<div class="cta-container">${ctaItems.map((item, idx) => renderCtaItem(item, idx)).join('')}</div>` : ''}
                    ${btnItems?.length ? html`<div class="btn-container">${btnItems.map((item, idx) => renderBtnItem(item, idx)).join('')}</div>` : ''}
                </div>
            </div>
        </section>`;
    },
};
