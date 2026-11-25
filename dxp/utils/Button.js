import getClasses from './classes.js';
import {html} from './html.js';
import {xssSafeContent} from './xss.js';

const ICON_POSITION = {
    LEADING: 'leading',
    TRAILING: 'trailing',
};

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

function ProgressSpinner() {
    return html`<div class="spinner-border"></div>`;
}

function ButtonIcon(iconClass, position) {
    if (!iconClass) {
        return '';
    }

    const iconClasses = getClasses({
        'qld-icon': true,
        'qld-icon-md': true,
        [iconClass]: !!iconClass,
        [position]: !!position,
    });

    return html` <span class="${escapeAttribute(iconClasses)}" aria-hidden="true"></span> `;
}

function ButtonContent({isProgress, iconClass, iconPosition, label, progressLabel, labelExtraAttributes}) {
    return html`
        ${isProgress ? ProgressSpinner() : iconPosition === ICON_POSITION.LEADING ? ButtonIcon(iconClass, iconPosition) : ''}
        <span class="btn-label-default" ${labelExtraAttributes || ''}>${xssSafeContent(label)}</span>
        ${isProgress && progressLabel ? `<span class="btn-label-progress">${xssSafeContent(progressLabel)}</span>` : ''}
        ${!isProgress && iconPosition === ICON_POSITION.TRAILING ? ButtonIcon(iconClass, iconPosition) : ''}
    `;
}

/**
 * Renders a button as HTML.
 * @param {{ className: string, label: string, ariaLabel: string, extraAttributes?: string, iconOnly?: boolean }} args - Button args. Set iconOnly true for icon-only buttons (e.g. btn-close): no "btn" prefix, no inner span.
 * @returns {string}
 */
export function Button({
    className,
    label,
    progressLabel,
    ariaLabel,
    buttonExtraAttributes,
    labelExtraAttributes,
    iconOnly = false,
    iconClass,
    iconPosition,
    isLink = false,
    isDisabled = false,
    isProgress = false,
    href = '#',
    target = '_self',
}) {
    const buttonClasses = iconOnly
        ? className
        : getClasses({
              btn: true,
              [className]: !!className,
              disabled: isDisabled || isProgress,
              'btn-progress': isProgress,
          });

    const ariaLabelAttr = ariaLabel ? `aria-label="${escapeAttribute(xssSafeContent(ariaLabel))}"` : '';
    const ariaDisabledAttr = isDisabled ? 'aria-disabled="true"' : '';
    const ariaLiveAttr = isProgress ? 'aria-live="polite"' : '';
    const dataProgressLabel = isProgress && progressLabel ? `data-progress-label="${escapeAttribute(xssSafeContent(progressLabel))}"` : '';

    const attributes = [ariaLabelAttr, ariaDisabledAttr, ariaLiveAttr, dataProgressLabel, buttonExtraAttributes].filter(Boolean).join(' ');

    if (isLink) {
        return html`<a class="${escapeAttribute(buttonClasses)}" href="${escapeAttribute(href)}" target="${escapeAttribute(target)}" ${attributes}>
            ${ButtonContent({isProgress, iconClass, iconPosition, label, progressLabel, labelExtraAttributes})}
        </a>`;
    }

    return html`<button class="${escapeAttribute(buttonClasses)}" type="button" tabindex="0" ${attributes}>
        ${ButtonContent({isProgress, iconClass, iconPosition, label, progressLabel, labelExtraAttributes})}
    </button>`;
}
