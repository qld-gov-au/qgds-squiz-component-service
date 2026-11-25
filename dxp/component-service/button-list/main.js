/**
 * Button list component
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

import {Button} from '../../utils/Button.js';

/**
 * Escape a value for a double-quoted HTML attribute.
 * xssSafeContent filters tags only, so it does not stop a quote from closing an attribute.
 */
function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export default {
    async main(input, componentUtilities) {
        const {buttons, wrapperClasses} = input || {};

        if (!buttons?.length) {
            return '';
        }

        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;

        return html`
            <div class="${escapeAttribute(xssSafeContent(wrapperClasses) || '')}">
                ${buttons
                    .map((button, index) =>
                        Button({
                            ...button,
                            isLink: true,
                            isProgress: false,
                            href: button?.link?.url,
                            target: button?.link?.target,
                            buttonExtraAttributes: editMode ? `data-sq-field="buttons[${index}].link"` : '',
                            labelExtraAttributes: editMode ? `data-sq-field="buttons[${index}].label"` : '',
                        }),
                    )
                    .join('')}
            </div>
        `;
    },
};
