(function () {
    'use strict';

    // Port of video.functions.js, wired as in src/js/qld.bootstrap.js.
    function videoEmbedPlay(event) {
        event.preventDefault();

        const thumbnail = event.target;
        const component = thumbnail.closest('.video');
        const iframe = component.querySelector('.video-embed iframe');

        component.classList.remove('not-ready');

        if (!iframe) {
            return;
        }

        // Parse iFrame URL and set the 'autoplay' parameter to 1.
        if (!iframe.classList.contains('video-custom')) {
            const url = new URL(iframe.src);
            url.searchParams.set('autoplay', '1');
            iframe.src = url.toString();
        }

        iframe.focus();
    }

    function videoTranscriptTitle(event) {
        const accordionButton = event.target;

        if (accordionButton.classList.contains('collapsed')) {
            accordionButton.textContent = 'Show transcript';
        } else {
            accordionButton.textContent = 'Hide transcript';
        }
    }

    function init() {
        document.querySelectorAll('.video-thumbnail').forEach((thumbnail) => {
            if (thumbnail.dataset.kernelInit === 'true') {
                return; // guard: qld.bootstrap.min.js may already have bound this
            }
            thumbnail.dataset.kernelInit = 'true';
            thumbnail.addEventListener('click', videoEmbedPlay);
        });

        document.querySelectorAll('.video .accordion .accordion-button').forEach((button) => {
            if (button.dataset.kernelInit === 'true') {
                return;
            }
            button.dataset.kernelInit = 'true';
            button.addEventListener('click', videoTranscriptTitle);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
