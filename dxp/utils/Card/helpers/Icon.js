import getClasses from '../../classes.js';
import {html} from '../../html.js';
import {escapeAttribute} from './attributes.js';

const ICON_POSITION = {
    TOP: 'top',
    LEFT: 'left',
};

export function Icon(icon) {
    const {iconClass, position, enabled} = icon;

    if (!iconClass || !enabled) {
        return '';
    }

    const iconClasses = getClasses({
        'qld-icon': true,
        'qld-icon-xxl': position === ICON_POSITION.TOP,
        'qld-icon-lg': position !== ICON_POSITION.TOP,
        [String(iconClass).trim()]: true,
        [`icon-${position}`]: !!position,
    });

    return html`
        <div class="card-icon-background">
            <span class="${escapeAttribute(iconClasses)}" aria-hidden="true"></span>
        </div>
    `;
}
