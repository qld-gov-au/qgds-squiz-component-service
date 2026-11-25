(function () {
    'use strict';

    // Port of accordion.functions.js, wired as in src/js/qld.bootstrap.js.
    function filterSpecialChar(value) {
        return decodeURI(value.toLowerCase().replace(/[^a-zA-Z0-9/]/g, ''));
    }

    function stopPropagation(event) {
        try {
            window.event.cancelBubble = true;
            event.stopPropagation();
        } catch {
            // ignore
        }
    }

    function setToggleState(button, open) {
        button.classList.toggle('accordion-toggle-btn--open', open);
        button.classList.toggle('accordion-toggle-btn--closed', !open);
        button.textContent = open ? 'Close all' : 'Open all';
    }

    function accordionToggleAll(event) {
        stopPropagation(event);

        const toggleAllButton = event.target;
        const wrapper = toggleAllButton.closest('.accordion-group');
        const accordionButtons = wrapper.querySelectorAll('.accordion-button');

        if (toggleAllButton.classList.contains('accordion-toggle-btn--closed')) {
            setToggleState(toggleAllButton, true);
            accordionButtons.forEach((button) => {
                if (button.matches('.collapsed')) button.click();
            });
        } else if (toggleAllButton.classList.contains('accordion-toggle-btn--open')) {
            setToggleState(toggleAllButton, false);
            accordionButtons.forEach((button) => {
                if (button.matches(':not(.collapsed)')) button.click();
            });
        }
    }

    function accordionToggleAllButtonState(event) {
        stopPropagation(event);

        const accordionGroup = event.target.closest('.accordion-group');
        const toggleAllButton = accordionGroup.querySelector('.accordion-toggle-btn');
        if (!toggleAllButton) return;

        const collapsedCount = accordionGroup.querySelectorAll('.accordion-button.collapsed').length;

        if (toggleAllButton.classList.contains('accordion-toggle-btn--closed') && collapsedCount === 0) {
            setToggleState(toggleAllButton, true);
        } else if (toggleAllButton.classList.contains('accordion-toggle-btn--open') && collapsedCount > 0) {
            setToggleState(toggleAllButton, false);
        }
    }

    function accordionHashLinks(event) {
        const urlHash = window.location.hash;
        const urlHashId = urlHash.substring(1);
        let cleanHash = filterSpecialChar(urlHash);

        if (cleanHash.length > 0) {
            const targetElement = document.querySelector(`#collapse-${CSS.escape(urlHashId)}`);
            let targetPanelButton = false;

            // Stop default hash link behaviour if target matches current hash location.
            if (event && ((event.type === 'hashchange' && event.newURL === event.oldURL) || (event.type === 'click' && event.target.hash === urlHash))) {
                event.preventDefault();
            }

            if (targetElement && targetElement.closest('.accordion-item')) {
                targetPanelButton = targetElement.closest('.accordion-item').querySelector('.accordion-button');
            } else {
                const accordionButtons = document.querySelectorAll('.accordion-button');

                if (event && event.type === 'click') {
                    cleanHash = filterSpecialChar(event.target.hash);
                }

                targetPanelButton = Array.from(accordionButtons).find((button) => filterSpecialChar(button.innerText) === cleanHash);
            }

            if (targetPanelButton) {
                if (targetPanelButton.matches('.collapsed')) targetPanelButton.click();

                window.scrollTo(0, targetPanelButton.getBoundingClientRect().top + document.documentElement.scrollTop);
            }
        }
    }

    function init() {
        document.querySelectorAll('.accordion-toggle-btn').forEach((toggleButton) => {
            if (toggleButton.dataset.kernelInit === 'true') {
                return; // guard: qld.bootstrap.min.js may already have bound this
            }
            toggleButton.dataset.kernelInit = 'true';
            toggleButton.addEventListener('click', accordionToggleAll);

            toggleButton
                .closest('.accordion-group')
                .querySelectorAll('.accordion-button')
                .forEach((button) => {
                    button.addEventListener('click', accordionToggleAllButtonState);
                });
        });

        if (window.__accordionInit) {
            return;
        }
        window.__accordionInit = true;

        accordionHashLinks();
        window.addEventListener('hashchange', accordionHashLinks);
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', accordionHashLinks);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
