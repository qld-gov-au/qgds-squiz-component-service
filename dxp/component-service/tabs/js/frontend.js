(function () {
    'use strict';

    // Port of tabs.functions.js (initTabsScroll), wired as in src/js/qld.bootstrap.js (DOMContentLoaded + window resize).
    function updateButtonVisibility(tab) {
        const tabs = tab.querySelector('.nav-tabs');
        const scrollLeftBtn = tab.querySelector('.scroll-left');
        const scrollRightBtn = tab.querySelector('.scroll-right');
        if (!tabs || !scrollLeftBtn || !scrollRightBtn) {
            return;
        }

        scrollLeftBtn.classList.toggle('show', tabs.scrollLeft !== 0);
        scrollRightBtn.classList.toggle('show', tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth);
    }

    function setupTab(tab) {
        const tabs = tab.querySelector('.nav-tabs');
        const scrollLeftBtn = tab.querySelector('.scroll-left');
        const scrollRightBtn = tab.querySelector('.scroll-right');
        if (!tabs || !scrollLeftBtn || !scrollRightBtn) {
            return;
        }

        // Guard: qld.bootstrap.min.js may already have bound this tab set, and this script may run twice.
        if (tab.dataset.kernelInit !== 'true') {
            tab.dataset.kernelInit = 'true';

            tabs.addEventListener('scroll', () => updateButtonVisibility(tab));
            scrollRightBtn.addEventListener('click', () => {
                tabs.scrollBy({top: 0, left: 200, behavior: 'smooth'});
            });
            scrollLeftBtn.addEventListener('click', () => {
                tabs.scrollBy({top: 0, left: -200, behavior: 'smooth'});
            });
        }

        updateButtonVisibility(tab);
    }

    function init() {
        document.querySelectorAll('.qld-tabs').forEach(setupTab);

        if (!window.__kernelTabsResizeInit) {
            window.__kernelTabsResizeInit = true;
            window.addEventListener('resize', () => {
                document.querySelectorAll('.qld-tabs').forEach(setupTab);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
