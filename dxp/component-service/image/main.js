/**
 * Image component
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

export default {
    async main(input, componentUtilities) {
        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;

        const {
            imageField = {},
            ratioClass = 'image-ratio-3x2',
            otherClass = '',
            imagePosition = {},
            customSizeOptions = {},
            figCaptionOptions = {},
            lazy = false,
            style,
            tabindex,
            role,
            wrapperClasses,
        } = input || {};

        const {imageSource = 'squizImage', squizImageField, src: customSrc, alt: customAlt = ''} = imageField;

        const original = squizImageField?.imageVariations?.original;
        const src = imageSource === 'squizImage' && original?.url ? original.url : customSrc;
        const alt = imageSource === 'squizImage' && squizImageField?.alt != null ? squizImageField.alt : customAlt;

        const {positionX = 'position-x-center', positionY = 'position-y-center'} = imagePosition;

        const {width, widthUnit = 'px', height, heightUnit = 'px'} = customSizeOptions;

        const {figureClass = '', caption, credit} = figCaptionOptions;

        if (!src) {
            return '';
        }

        const imgClasses = [ratioClass, otherClass, positionX, positionY].filter(Boolean).join(' ').trim();

        const widthAttr = width != null && String(width).trim() !== '' ? ` width="${xssSafeContent(String(width))}${xssSafeContent(widthUnit)}"` : '';
        const heightAttr = height != null && String(height).trim() !== '' ? ` height="${xssSafeContent(String(height))}${xssSafeContent(heightUnit)}"` : '';
        const loadingAttr = lazy ? ' loading="lazy"' : '';
        const styleAttr = style != null && String(style).trim() !== '' ? ` style="${xssSafeContent(style)}"` : '';
        const tabindexAttr = tabindex != null && String(tabindex).trim() !== '' ? ` tabindex="${xssSafeContent(tabindex)}"` : '';
        const roleAttr = role != null && String(role).trim() !== '' ? ` role="${xssSafeContent(role)}"` : '';

        const imageTag = html`<img
            class="${imgClasses}"
            src="${xssSafeContent(src)}"
            alt="${xssSafeContent(alt)}"
            ${widthAttr}${heightAttr}${loadingAttr}${styleAttr}${tabindexAttr}${roleAttr}
        />`;

        const hasCaptionOrCredit = (caption != null && String(caption).trim() !== '') || (credit != null && String(credit).trim() !== '');

        if (hasCaptionOrCredit) {
            const figureStyleAttr = width != null && String(width).trim() !== '' ? ` style="width:${xssSafeContent(String(width))}${xssSafeContent(widthUnit)}"` : '';
            return html`<figure class="${xssSafeContent(figureClass)}" ${figureStyleAttr}>
                ${imageTag}
                <figcaption>
                    <span ${editMode ? `data-sq-field="figCaptionOptions.caption"` : ''}>${caption != null ? xssSafeContent(caption) : ''}</span>
                    ${
                        credit != null && String(credit).trim() !== ''
                            ? html`<span class="figure-credit" ${editMode ? `data-sq-field="figCaptionOptions.credit"` : ''}>${xssSafeContent(credit)}</span>`
                            : ''
                    }
                </figcaption>
            </figure>`;
        }

        return html`<div class="${xssSafeContent(wrapperClasses) || ''}">${imageTag}</div>`;
    },
};
