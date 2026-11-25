import {html} from '../html.js';
import {xssSafeContent} from '../xss.js';

function SuggestionItem({text, url, target}) {
    if (!text || !url) {
        return '';
    }

    return html`
    <li>
      <a tabindex="0" href="${url}">${text}</a>
    </li>
  `;
}

function SuggestionCategory({title, viewMoreLink, suggestions}) {
    if (!suggestions?.length) {
        return '';
    }

    return html`
    <div class="suggestions-category">
      <strong class="suggestions-category-label d-block"
        >${xssSafeContent(title)}</strong
      >
      <ul>
        ${suggestions?.map((item) => SuggestionItem(item || {})).join('')}
        ${
            viewMoreLink?.url
                ? html`<li>
              <a
                tabindex="0"
                href="${xssSafeContent(viewMoreLink.url)}"
                class="view-more"
              >
                ${viewMoreLink?.text || 'View more'}
              </a>
            </li>`
                : ''
        }
      </ul>
    </div>
  `;
}

function ManualSuggestions(manualSuggestions) {
    if (!manualSuggestions?.length) {
        return '';
    }

    return html`
    <div class="default-suggestions">
      ${manualSuggestions.map(SuggestionCategory || {}).join('')}
    </div>
  `;
}

function DynamicSuggestions({fbSettings, viewMoreLink}) {
    if (!fbSettings?.collection) {
        return '';
    }

    return html`
    <div
      class="dynamic-suggestions"
      ${viewMoreLink?.url ? `data-view-more="${xssSafeContent(viewMoreLink?.url)}"` : ''}
    ></div>
  `;
}

export function Suggestions({hasManualSuggestions, hasDynamicSuggestions, dynamic, manual}) {
    if (!hasManualSuggestions && !hasDynamicSuggestions) {
        return '';
    }

    return html`
    <div class="suggestions suggestions__group default">
      ${hasDynamicSuggestions ? DynamicSuggestions(dynamic || {}) : ''}
      ${hasManualSuggestions ? ManualSuggestions(manual || []) : ''}
    </div>
  `;
}
