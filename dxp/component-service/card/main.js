/**
 * Card component (Advanced)
 */

import {html} from '../../utils/html.js';

import {Card} from '../../utils/Card/Card.js';
import {escapeAttribute} from '../../utils/Card/helpers/attributes.js';
import {resolveCardLinks} from '../../utils/Card/helpers/resolveCardLinks.js';

export default {
    async main(input, componentUtilities) {
        const {cards, settings} = input || {};

        if (!cards || !cards.length) {
            return '';
        }

        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;

        // Resolve Matrix asset SquizLinks before the sync render helpers read url and text.
        const resolvedCards = await resolveCardLinks(cards, componentUtilities);

        return html`
            <div class="${escapeAttribute(settings?.wrapperClasses || '')}">${resolvedCards.map((card, index) => Card(card, {...settings, index, editMode})).join('')}</div>
        `;
    },
};
