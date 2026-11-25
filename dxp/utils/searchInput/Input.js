import {html} from '../html.js';
import {xssSafeContent} from '../xss.js';

export function Input({id, name, ariaLabel, placeholder, extraAttributes}) {
    return html`
    <input
      id="${xssSafeContent(id)}"
      name="${xssSafeContent(name)}"
      class="form-control"
      type="text"
      autocomplete="off"
      aria-label="${xssSafeContent(ariaLabel)}"
      placeholder="${xssSafeContent(placeholder)}"
      ${extraAttributes}
    />
  `;
}
