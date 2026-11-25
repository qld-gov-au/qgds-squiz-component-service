import {html} from '../html.js';
import {xssSafeContent} from '../xss.js';

export function Button({id, label, type = 'submit'}) {
    if (!label || !id) {
        return '';
    }

    return html`
    <button
      class="btn btn-primary"
      type="submit"
      id="${xssSafeContent(id)}"
      aria-label="${xssSafeContent(label)}"
    >
      <span class="btn-icon" aria-hidden="true"></span>
      <span class="btn-label">${xssSafeContent(label)}</span>
    </button>
  `;
}
