(function () {
    'use strict';

    // Port of globalAlert.function.js (initGlobalAlerts), wired as in src/js/qld.bootstrap.js.
    function setLocalStorageWithExpiry(key, value, dismissedExpiryDays) {
        const d = new Date();
        d.setTime(d.getTime() + dismissedExpiryDays * 24 * 60 * 60 * 1000);
        localStorage.setItem(key, JSON.stringify({value: value, expiry: d.getTime()}));
    }

    function getLocalStorageWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }

        try {
            const item = JSON.parse(itemStr);
            if (new Date().getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        } catch {
            localStorage.removeItem(key);
            return null;
        }
    }

    function init() {
        document.querySelectorAll('.global-alert').forEach(function (alert) {
            if (alert.dataset.kernelInit === 'true') {
                return; // guard: qld.bootstrap.min.js may already have bound this
            }
            alert.dataset.kernelInit = 'true';

            const id = alert.getAttribute('data-id');

            // Only check localStorage if there's an ID
            if (id) {
                if (!getLocalStorageWithExpiry('dismissedAlert-' + id)) {
                    alert.classList.remove('d-none');
                }
            } else {
                alert.classList.remove('d-none');
            }

            // Only add listeners if dismissable
            if (alert.querySelector('.btn-close')) {
                const handleAlertClose = function () {
                    const dismissedExpiryDays = parseInt(alert.getAttribute('data-expiry-days'), 10);

                    // Only save to localStorage if both ID and valid expiry exist
                    if (id && dismissedExpiryDays && dismissedExpiryDays > 0) {
                        setLocalStorageWithExpiry('dismissedAlert-' + id, true, dismissedExpiryDays);
                    }

                    alert.classList.add('d-none');
                };

                // Bootstrap alert close event and custom btn-closed event
                alert.addEventListener('closed.bs.alert', handleAlertClose);
                alert.addEventListener('btn-closed', handleAlertClose);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
