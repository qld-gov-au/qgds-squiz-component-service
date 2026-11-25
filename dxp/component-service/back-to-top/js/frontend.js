(function () {
    'use strict';

    // Port of backToTop.functions.js, wired as in src/js/qld.bootstrap.js (called on load).
    function init() {
        const link = document.querySelector('.back-to-top .qld-dir-link');

        if (!link || link.dataset.kernelInit === 'true') {
            return; // guard: qld.bootstrap.min.js may already have bound this
        }
        link.dataset.kernelInit = 'true';

        link.onclick = function (event) {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
            event.preventDefault();
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
