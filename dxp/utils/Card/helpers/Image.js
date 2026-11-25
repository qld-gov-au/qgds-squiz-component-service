import {html} from '../../html.js';

import {VideoOverlay} from './Video.js';
import {cssUrl, escapeAttribute, safeUrl} from './attributes.js';

const IMAGE_SOURCE = {
    MATRIX: 'Matrix',
    EXTERNAL: 'External',
};

export function Image(image, feature, video, editMode, index) {
    const {source, matrix, external, enabled} = image;

    if (!enabled) {
        return '';
    }

    const url = safeUrl(source === IMAGE_SOURCE.MATRIX ? matrix?.imageVariations?.original?.url : external?.url);

    const isMatrix = source === IMAGE_SOURCE.MATRIX;
    const alt = isMatrix ? matrix?.alt : external?.alt;

    // Keep the Matrix image target in edit mode so an editor can still pick an image.
    // External images have no inline-editable field, so they render nothing when empty.
    if (!url && !(editMode && isMatrix)) {
        return '';
    }

    const cardImageClasses = feature?.enabled ? `card-img-${escapeAttribute(feature?.imagePosition)}` : 'card-img-top';

    const imageEditAttr = editMode && isMatrix ? `data-sq-field="cards[${index}].image.matrix"` : '';

    const styleAttr = url ? `style="${escapeAttribute(`--card-image:${cssUrl(url)}`)}"` : '';

    // alt on a div is not announced, so expose the image only when it has text.
    const roleAttr = alt ? `role="img" aria-label="${escapeAttribute(alt)}"` : '';

    return html`
        <div class="card-img ratio ratio-16x9">
            <div class="${cardImageClasses}" ${styleAttr} ${roleAttr} ${imageEditAttr}></div>
            ${VideoOverlay(video, editMode, index)}
        </div>
    `;
}
