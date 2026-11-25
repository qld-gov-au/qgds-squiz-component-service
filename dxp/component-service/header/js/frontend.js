(function () {
    'use strict';

    // Port of header.functions.js (toggleSearch), wired as in src/js/qld.bootstrap.js:
    // click on #qld-header-toggle-search-button toggles #qld-header-search. Also sets data-page-url on <header>.
    // The primary navbar behaviour (initializeNavbar) belongs to the navbar component, not ported here.
    function toggleSearch(event) {
        // Prevent default action and stop event propagation
        try {
            event.preventDefault();
            event.stopPropagation();
        } catch (error) {
            console.error('Error in event handling:', error);
        }

        const searchDiv = document.getElementById('qld-header-search');
        const toggleButton = event.currentTarget;

        if (!searchDiv) {
            return;
        }

        if (searchDiv.classList.contains('is-open')) {
            searchDiv.classList.remove('is-open');
            searchDiv.classList.add('is-closed');

            // Change icon and text back to default
            toggleButton.classList.remove('is-open');
            toggleButton.classList.add('is-closed');
            toggleButton.setAttribute('aria-expanded', false);
            toggleButton.setAttribute('aria-label', 'Open search');
            toggleButton.textContent = 'Search';
        } else {
            searchDiv.classList.remove('is-closed');
            searchDiv.classList.add('is-open');

            // Change icon and text to active state
            toggleButton.classList.remove('is-closed');
            toggleButton.classList.add('is-open');
            toggleButton.setAttribute('aria-expanded', true);
            toggleButton.setAttribute('aria-label', 'Close search');
            toggleButton.textContent = 'Close';
        }
    }

    function init() {
        // Set the data-page-url attribute on the <header> element (current page URL without query string).
        const header = document.querySelector('header');
        if (header) {
            header.setAttribute('data-page-url', window.location.origin + window.location.pathname);
        }

        const headerSearchButton = document.getElementById('qld-header-toggle-search-button');
        if (!headerSearchButton || headerSearchButton.dataset.kernelInit === 'true') {
            return; // guard: qld.bootstrap.min.js may already have bound this
        }
        headerSearchButton.dataset.kernelInit = 'true';
        headerSearchButton.addEventListener('click', toggleSearch);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
