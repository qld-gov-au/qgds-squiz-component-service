(function () {
    'use strict';

    // Port of breadcrumbs.functions.js, wired as in src/js/qld.bootstrap.js (initBreadcrumb on DOMContentLoaded).

    function resetTabIndex(tabindex) {
        const breadcrumbListExpanded = document.querySelectorAll('.breadcrumb-collapse-wrapper li');
        if (!breadcrumbListExpanded) {
            return;
        }
        breadcrumbListExpanded.forEach((crumb) => {
            crumb.querySelector('a')?.setAttribute('tabindex', tabindex);
        });
    }

    // Document click listener used to collapse the menu when clicking elsewhere.
    function collapseMenu(event) {
        event.stopPropagation();
        const expandButton = document.querySelector('.breadcrumb-toggle-link');
        const expandMenu = document.querySelector('.breadcrumb-collapse-wrapper');
        if (!expandMenu.contains(event.target) && !expandButton.contains(event.target)) {
            expandMenu.parentElement.classList.remove('expanded');
            document.removeEventListener('click', collapseMenu);
            resetTabIndex(-1);
        }
    }

    function expandMenu(event) {
        const breadcrumb = event.target.closest('.breadcrumb');
        if (!breadcrumb) {
            console.log('expandMenu: Breadcrumb does not exist.');
            return;
        }
        const breadcrumbList = breadcrumb.querySelectorAll('.breadcrumb-item');

        if (!breadcrumbList || !breadcrumbList.length) {
            console.log('expandMenu: Breadcrumb does not exist or is empty.');
            return;
        }

        event.target.parentElement.classList.toggle('expanded');
        if (event.target.parentElement.classList.contains('expanded')) {
            // Focus the first focusable element inside
            const menu = document.querySelector('.breadcrumb-collapse-wrapper');
            resetTabIndex(0);
            const firstItem = menu.querySelector('a');
            if (firstItem) {
                firstItem.focus();
            }
        }
        const expandButton = document.querySelector('.breadcrumb-toggle-link');
        if (expandButton) {
            document.addEventListener('click', collapseMenu);
        }
    }

    function breadcrumbCollapse(breadcrumbList, maxLength = 5) {
        // No shortening is required when breadcrumb does not exist or its length is within the maximum range.
        if (!breadcrumbList || breadcrumbList.length <= maxLength) {
            return;
        }

        const newList = document.createElement('ol');
        newList.classList.add('breadcrumb-vertical');

        breadcrumbList.forEach((crumb, index) => {
            if (index > 0 && index < breadcrumbList.length - 2) {
                crumb.querySelector('a')?.setAttribute('tabindex', -1);
                newList.appendChild(crumb);
            }

            if (index === 0) {
                const expandCrumb = document.createElement('li');
                const expandButton = document.createElement('button');

                expandCrumb.classList.add('breadcrumb-item', 'breadcrumb-toggle');
                expandButton.setAttribute('aria-label', 'Expand the breadcrumbs');
                expandButton.type = 'button';
                expandButton.classList.add('breadcrumb-toggle-link');
                expandButton.addEventListener('click', expandMenu);

                expandCrumb.appendChild(expandButton);
                crumb.after(expandCrumb);
            }

            if (index === breadcrumbList.length - 1) {
                const expandCrumb = document.querySelector('.breadcrumb-toggle');
                if (expandCrumb) {
                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.classList.add('breadcrumb-collapse-wrapper');
                    wrapperDiv.appendChild(newList);
                    expandCrumb.append(wrapperDiv);
                    expandCrumb.addEventListener('focusout', (event) => {
                        // Check if the element receiving focus is outside the dropdown container
                        if (!event.relatedTarget || !expandCrumb.contains(event.relatedTarget)) {
                            wrapperDiv.parentElement.classList.remove('expanded');
                        }
                    });
                }
            }
        });
    }

    function init() {
        // Set the standard breadcrumb length.
        let maxLength = 5;

        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) {
            return;
        }

        // Guard: qld.bootstrap.min.js may already have initialised this breadcrumb.
        if (breadcrumb.querySelector('.breadcrumb-toggle') || breadcrumb.dataset.kernelInit === 'true') {
            return;
        }
        breadcrumb.dataset.kernelInit = 'true';

        const breadcrumbList = breadcrumb.querySelectorAll('.breadcrumb-item');
        if (!breadcrumbList || !breadcrumbList.length) {
            return;
        }

        const breadcrumbParent = breadcrumb.parentElement;
        if (!breadcrumbParent) {
            return;
        }

        // Collapse breadcrumb when width of breadcrumb overflows the container.
        if (breadcrumb.clientWidth >= breadcrumbParent.clientWidth) {
            maxLength = 3;
        }
        breadcrumbCollapse(breadcrumbList, maxLength);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
