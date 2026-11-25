import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

function renderAccordionItem(headingTag, item, index) {
    const itemId = xssSafeContent(item?.id || '');
    return html`
    <div class="accordion-item">
      <${headingTag} class="accordion-header" id="heading-${itemId}">
          <button class="accordion-button ${!item.expanded ? 'collapsed' : ''}" type="button" 
                  data-bs-toggle="collapse" data-bs-target="#collapse-${itemId}" 
                  aria-expanded="${item.expanded}" aria-controls="collapse-${itemId}" data-sq-field="accordionItems[${index}].title">
              ${xssSafeContent(item.title)}
          </button>
      </${headingTag}>

      <div id="collapse-${itemId}" class="accordion-collapse collapse ${item.expanded ? 'show' : ''}" 
          aria-labelledby="heading-${itemId}">
          <div class="accordion-body" data-sq-field="accordionItems[${index}].content">
              ${xssSafeContent(item.content)}
          </div>
      </div>
    </div>
  `;
}

function renderToggleAll() {
    return html`
        <div class="accordion-toggle">
            <button class="accordion-toggle-btn accordion-toggle-btn--closed" type="button">Open all</button>
        </div>
    `;
}

/**
 * Accordion component
 */
export default {
    async main(input) {
        const {groupId, toggleAll, headingTag, wrapperClasses, accordionItems} = input || {};
        const items = (accordionItems || []).map((item, index) => renderAccordionItem(headingTag || 'h2', item, index)).join('');

        if (!items) {
            return '';
        }

        return html`
            <div class="${xssSafeContent(wrapperClasses) || ''}">
                <div class="accordion-group">
                    ${toggleAll ? renderToggleAll() : ''}
                    <div class="accordion" id="${xssSafeContent(groupId)}">${items}</div>
                </div>
            </div>
        `;
    },
};
