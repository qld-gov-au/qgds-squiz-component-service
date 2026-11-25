import {html} from '../html.js';

// Helpers
import {Image} from './helpers/Image.js';
import {Icon} from './helpers/Icon.js';
import {Body} from './helpers/Body.js';
import {Footer} from './helpers/Footer.js';
import {ACTION_CLASS_MAP} from './helpers/Heading.js';
import {escapeAttribute} from './helpers/attributes.js';
import getClasses from '../classes.js';

export function Card(input, settings) {
    const {heading = {}, body = {}, icon = {}, image = {}, feature = {}, video = {}, footer = {}} = input;

    const {action, isArrowVisible, isEqualHeight, variant, editMode, index} = settings;

    const wrapperClasses = feature?.enabled ? 'col-md-12 col-lg-12' : 'col';

    const cardClassesConfig = {
        card: true,
        [`card-${variant} ${variant}`]: !!variant,
        [`icon-${icon?.position}`]: icon?.enabled && icon?.position,
        [`card-${ACTION_CLASS_MAP[action]}-action`]: !!ACTION_CLASS_MAP[action],
        'h-100': isEqualHeight,
        [`card-feature card-feature-${feature?.imagePosition}`]: feature?.enabled && feature?.imagePosition,
        'card-video': video?.enabled,
    };

    const cardClasses = escapeAttribute(getClasses(cardClassesConfig));

    if (feature?.enabled) {
        return html`
            <div class="${wrapperClasses}">
                <div class="${cardClasses}">
                    ${Image(image, feature, video, editMode, index)} ${Icon(icon)}
                    <div class="card-inner">${Body(settings, heading, body, editMode, index)} ${Footer(footer, editMode, index)}</div>
                </div>
            </div>
        `;
    }

    return html`
        <div class="${wrapperClasses}">
            <div class="${cardClasses}">
                ${Image(image, feature, video, editMode, index)} ${Icon(icon)} ${Body(settings, heading, body, editMode, index)} ${Footer(footer, editMode, index)}
            </div>
        </div>
    `;
}
