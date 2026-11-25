/**
 * Modal component
 * QGDS Bootstrap 5 modal with trigger button.
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import {Button} from '../../utils/Button.js';

const escapeAttribute = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

export default {
    async main(input) {
        const {
            modalIdSettings = {},
            launchButtonLabel = 'Open modal',
            modalSize = 'default',
            header: headerOpt = null,
            content = '',
            footer: footerOpt = null,
            wrapperClasses,
        } = input || {};
        const modalIdSource = modalIdSettings.modalIdSource ?? 'default';
        const customModalId = modalIdSettings.customModalId ?? '';

        const random5 = String(Math.floor(10000 + Math.random() * 90000));
        const modalId =
            modalIdSource === 'custom' && customModalId && String(customModalId).trim()
                ? String(customModalId)
                      .trim()
                      .replace(/[^a-zA-Z0-9-_]/g, '-')
                : 'modal-' + random5;
        const safeModalId = xssSafeContent(modalId);
        const sizeClassMap = {
            default: ' modal-default',
            small: ' modal-sm',
            large: ' modal-lg',
            'extra-large': ' modal-xl',
        };
        const sizeClass = sizeClassMap[modalSize] ?? (modalSize ? ` ${xssSafeContent(modalSize).replace(/[^a-zA-Z0-9-_ ]/g, '')}` : '');

        const triggerButton = Button({
            className: 'btn-primary',
            label: launchButtonLabel,
            ariaLabel: launchButtonLabel,
            buttonExtraAttributes: `data-bs-toggle="modal" data-bs-target="#${safeModalId}"`,
        });

        const headerSection =
            headerOpt && (headerOpt.title != null || headerOpt.closeButton)
                ? html`<div class="modal-header">
                      ${
                          headerOpt.title != null && String(headerOpt.title).trim()
                              ? html`<h1 class="modal-title" id="${safeModalId}-label">${xssSafeContent(String(headerOpt.title).trim())}</h1>`
                              : ''
                      }
                      ${
                          headerOpt?.closeButton !== false
                              ? Button({
                                    className: 'btn-close',
                                    label: '',
                                    ariaLabel: 'Close',
                                    buttonExtraAttributes: 'data-bs-dismiss="modal"',
                                    iconOnly: true,
                                })
                              : ''
                      }
                  </div>`
                : '';

        const bodySection = html`<div class="modal-body">${content ? xssSafeContent(content) : ''}</div>`;

        const showCancel = footerOpt?.showCancelButton !== false;
        const showConfirm = footerOpt?.showConfirmButton !== false;
        const cancelButton = showCancel
            ? Button({
                  className: 'btn-secondary',
                  label: 'Cancel',
                  ariaLabel: 'Close',
                  buttonExtraAttributes: 'data-bs-dismiss="modal"',
              })
            : '';
        const confirmButton = showConfirm
            ? Button({
                  className: 'btn-primary',
                  label: 'Confirm',
                  ariaLabel: 'Confirm',
                  buttonExtraAttributes: 'data-bs-dismiss="modal"',
              })
            : '';
        const hasFooterButtons = showCancel || showConfirm;
        const footerSection = footerOpt && hasFooterButtons ? html`<div class="modal-footer">${cancelButton}${confirmButton}</div>` : '';

        const modalMarkup = html`<div class="modal fade" id="${safeModalId}" tabindex="-1" aria-labelledby="${safeModalId}-label" aria-hidden="true">
            <div class="modal-dialog${sizeClass}">
                <div class="modal-content">${headerSection} ${bodySection} ${footerSection}</div>
            </div>
        </div>`;

        return html`<div class="${escapeAttribute(xssSafeContent(wrapperClasses || ''))}">${triggerButton} ${modalMarkup}</div>`;
    },
};
