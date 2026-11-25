import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import {squizLinkHref, squizLinkLabel} from '../../utils/squizLink.ts';

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 * (xssSafeContent filters HTML text but does not escape quotes.)
 */
function attr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderAlertItem(item, editMode) {
    const {variant, ariaLabel, dismissedExpiryDays, content, link, preventDismiss} = item;
    return html`
        <section
            role="alert"
            class="mb-0 global-alert alert-dismissible alert ${editMode ? '' : 'd-none'} ${attr(variant)}"
            data-variant="${attr(variant)}"
            ${ariaLabel ? `aria-label="${attr(ariaLabel)}"` : ''}
            ${dismissedExpiryDays ? `data-expiry-days="${attr(dismissedExpiryDays)}"` : ''}
        >
            <div class="qld-global-alert-main container">
                <div class="global-alert-icon">
                    ${variant === 'global-alert-critical' ? html`<span class="qld-icon qld-icon-sm qld-icon-alert-danger" aria-hidden="true"></span>` : ''}
                    ${variant === 'global-alert-info' ? html`<span class="qld-icon qld-icon-sm qld-icon-alert-information" aria-hidden="true"></span>` : ''}
                    ${variant === 'global-alert-warning' ? html`<span class="qld-icon qld-icon-sm qld-icon-alert-warning" aria-hidden="true"></span>` : ''}
                </div>
                <div class="global-alert-content">
                    <div class="global-alert-message">${xssSafeContent(content || '')}</div>
                    <div class="global-alert-action">
                        ${
                            link
                                ? html`<a href="${attr(squizLinkHref(link))}" target="${attr(link.target)}" aria-label="${attr(squizLinkLabel(link))}"
                                      >${xssSafeContent(squizLinkLabel(link))}<span class="qld-icon qld-icon-sm qld-icon-arrow-right" aria-hidden="true"> </span
                                  ></a>`
                                : ''
                        }
                    </div>
                </div>
                ${
                    preventDismiss
                        ? ''
                        : html` <div class="global-alert-close">
                              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                          </div>`
                }
            </div>
        </section>
    `;
}

/**
 * Global Alert component
 */
export default {
    async main(input, componentUtilities) {
        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;
        const {alertItems = [], wrapperClasses} = input || {};
        const items = alertItems.map((item) => renderAlertItem(item, editMode)).join('');

        return html` <div class="global-alert-include ${attr(wrapperClasses)}">${items}</div>`;
    },
};
