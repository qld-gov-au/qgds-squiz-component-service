import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

const ASPECT_RATIO_CLASS_MAP = {
    '1:1': '1x1',
    '4:3': '4x3',
    '16:9': '16x9',
    '21:9': '21x9',
};

const VIDEO_SOURCE = {
    YOUTUBE: 'YouTube',
    VIMEO: 'Vimeo',
    CUSTOM: 'Custom',
};

const IMAGE_SOURCE = {
    MATRIX: 'Matrix',
    CUSTOM_URL: 'Custom URL',
};

const SIZE_CLASS_MAP = {
    'Full width': 'col-12',
    'Two thirds': 'col-8',
    'Half page': 'col-6',
};

const escapeAttribute = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

// Use for values placed inside HTML attributes (xssSafeContent alone leaves quotes intact).
const attr = (value) => escapeAttribute(xssSafeContent(value));

function transcriptAccordion({videoId, transcriptContent}) {
    const id = attr(videoId);
    return html`
        <div class="accordion-group">
            <div class="accordion" id="video-transcript-${id}">
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading-${id}">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-${id}"
                            aria-expanded="false"
                            aria-controls="collapse-${id}"
                        >
                            Show transcript
                        </button>
                    </h2>

                    <div id="collapse-${id}" class="accordion-collapse collapse" aria-labelledby="heading-${id}" role="region" style="">
                        <div class="accordion-body">${transcriptContent ? xssSafeContent(transcriptContent) : ''}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Video component
 */
export default {
    async main(input) {
        const {source, videoId, videoSize, aspectRatio, duration, thumbnail, description, transcriptContent, additionalSettings, wrapperClasses} = input || {};

        const {imageSource = IMAGE_SOURCE.MATRIX, squizImageField, src: customSrc} = thumbnail || {};

        const original = squizImageField?.imageVariations?.original;
        const src = imageSource === IMAGE_SOURCE.MATRIX && original?.url ? original.url : customSrc;

        return html`
            <section class="video ${additionalSettings?.autoPlay ? '' : ' not-ready'} ${attr(wrapperClasses) || ''} ${src ? '' : 'empty-thumbnail'} ${SIZE_CLASS_MAP[videoSize]}">
                <div class="video-description" data-sq-field="description">${xssSafeContent(description)}</div>
                <div class="video-transcript" data-sq-field="transcriptContent">${transcriptAccordion({videoId, transcriptContent})}</div>

                <div class="video-player ratio ratio-${ASPECT_RATIO_CLASS_MAP[aspectRatio]}">
                    <a href="#" class="video-thumbnail video-controls" title="Play Video" aria-label="Watch video ${duration ? `- duration ${attr(duration)}` : ''}">
                        <div class="video-thumbnail-image" style="--thumbnail:url(${attr(src)})" data-sq-field="thumbnail"></div>
                        ${
                            !additionalSettings?.autoPlay
                                ? html`<div class="video-nav">
                                      <div class="video-watch"><span class="icon"></span><span>Watch</span></div>
                                      ${
                                          duration
                                              ? html`<div title="Video duration" class="video-duration"><span class="icon"></span><span>${xssSafeContent(duration)}</span></div>`
                                              : ''
                                      }
                                  </div>`
                                : ''
                        }
                    </a>
                    <div class="video-embed ratio ratio-${attr(aspectRatio)}">
                        ${
                            source === VIDEO_SOURCE.VIMEO && videoId
                                ? html`
                                      <iframe
                                          title="Vimeo video"
                                          class="embed-responsive-item video-vimeo"
                                          allow="autoplay; fullscreen"
                                          allowfullscreen
                                          muted="muted"
                                          src="https://player.vimeo.com/video/${attr(videoId)}?rel=0&autoplay=${additionalSettings?.autoPlay}&background=${attr(src)}&controls=${additionalSettings?.videoControls}"
                                      ></iframe>
                                  `
                                : ''
                        }
                        ${
                            source === VIDEO_SOURCE.YOUTUBE && videoId
                                ? html`
                                      <iframe
                                          title="YouTube video"
                                          class="embed-responsive-item video-youtube"
                                          allow="autoplay; fullscreen"
                                          allowfullscreen
                                          referrerpolicy="strict-origin-when-cross-origin"
                                          src="https://www.youtube.com/embed/${attr(videoId)}?rel=0&autoplay=${additionalSettings?.autoPlay}&controls=${additionalSettings?.videoControls}"
                                      ></iframe>
                                  `
                                : ''
                        }
                        ${
                            source === VIDEO_SOURCE.CUSTOM && videoId
                                ? html`
                                      <iframe
                                          title="Custom video"
                                          class="embed-responsive-item video-custom"
                                          allow="autoplay; fullscreen"
                                          allowfullscreen
                                          src="${attr(videoId)}"
                                      ></iframe>
                                  `
                                : ''
                        }
                        ${!videoId ? html` <p class="text-center position-absolute top-50">A video has not been provided.</p> ` : ''}
                    </div>
                </div>
            </section>
        `;
    },
};
