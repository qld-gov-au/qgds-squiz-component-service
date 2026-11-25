import xss, {getDefaultWhiteList} from 'xss';

export const specificTagChanges = {
    circle: ['cx', 'cy', 'r', 'stroke', 'stroke-width', 'fill'],
    clipPath: [],
    defs: [],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'style'],
    g: ['clip-path', 'fill'],
    line: ['x1', 'y1', 'x2', 'y2', 'style'],
    path: ['d', 'fill', 'stroke', 'stroke-width'],
    polygon: ['points', 'style'],
    polyline: ['points', 'style'],
    rect: ['width', 'height', 'fill'],
    svg: ['width', 'height', 'viewBox', 'fill'],
};

const addToAll = [
    'class',
    'id',
    // WCAG ARIA related roles (https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes)
    // Allow on anything and leave it to the developer to use it on the correct tags.
    'role',
    'aria-activedescendant',
    'aria-atomic',
    'aria-autocomplete',
    'aria-braillelabel',
    'aria-brailleroledescription',
    'aria-busy',
    'aria-checked',
    'aria-colcount',
    'aria-colindex',
    'aria-colindextext',
    'aria-colspan',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-expanded',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-level',
    'aria-live',
    'aria-modal',
    'aria-multiline',
    'aria-multiselectable',
    'aria-orientation',
    'aria-owns',
    'aria-placeholder',
    'aria-posinset',
    'aria-pressed',
    'aria-readonly',
    'aria-relevant',
    'aria-required',
    'aria-roledescription',
    'aria-rowcount',
    'aria-rowindex',
    'aria-rowindextext',
    'aria-rowspan',
    'aria-selected',
    'aria-setsize',
    'aria-sort',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
];

function buildWhitelist() {
    const defaults = getDefaultWhiteList();
    const merged = {...defaults, ...specificTagChanges};
    const whiteList = {};

    for (const [tag, attrs] of Object.entries(merged)) {
        if (Array.isArray(attrs)) {
            whiteList[tag] = [...attrs, ...addToAll];
        } else {
            whiteList[tag] = [...addToAll];
        }
    }

    return whiteList;
}

const whiteList = buildWhitelist();

export function xssSafeContent(content) {
    return xss(content, {whiteList});
}
