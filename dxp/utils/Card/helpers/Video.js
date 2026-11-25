import {html} from '../../html.js';
import {xssSafeContent} from '../../xss.js';

function VideoDuration(duration, editMode, index) {
    // Keep the duration target in edit mode so an editor can add a duration.
    if (!duration && !editMode) {
        return '';
    }

    const durationEditAttr = editMode ? `data-sq-field="cards[${index}].video.duration"` : '';

    return html`
        <div title="Video duration" class="video-duration">
            <span class="qld-icon qld-icon-sm qld-icon-clock" aria-hidden="true"></span>
            <span ${durationEditAttr}>${xssSafeContent(duration || '')}</span>
        </div>
    `;
}

export function VideoOverlay(video, editMode, index) {
    if (!video?.enabled) {
        return '';
    }

    return html`
        <div class="video-overlay">
            <div class="video-nav">
                <div class="video-watch"><span class="qld-icon qld-icon-lg qld-icon-video" aria-hidden="true"></span><span>Watch</span></div>
                ${VideoDuration(video?.duration, editMode, index)}
            </div>
        </div>
    `;
}
