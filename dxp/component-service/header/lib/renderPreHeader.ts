import {html} from '../../../utils/html.js';
import {xssSafeContent} from '../../../utils/xss.js';
import {editorSqField} from './editorSqField';
import {renderCoaLogo} from '../../../utils/logo/renderCoaLogo';
import {shouldShowSiteSearch} from './renderHeaderSearch';

import {hasSquizLinkContent, squizLinkHref, squizLinkLabel} from '../../../utils/squizLink';
import {resolvePreHeaderPaletteClass} from './resolveBrandPalettes';
import {resolveBrandLayout} from './resolveBrandLayout';
import {resolvePreHeaderGlobalLink} from './resolvePreHeaderGlobalLink';
import type {HeaderInput, HeaderPreHeaderAction, HeaderPreHeaderActionDropdown, RenderHeaderBannerOptions} from './types';

function isHtmlOrFormDropdown(dropdown: HeaderPreHeaderActionDropdown): boolean {
    const type = dropdown.type?.trim() ?? '';
    return type === 'html' || type === 'form';
}

function resolvePreHeaderActionIcon(action: HeaderPreHeaderAction): string {
    const dropdown = action.dropdown;
    if (dropdown?.type === 'none' && dropdown.icon?.trim()) {
        return dropdown.icon.trim();
    }
    return '';
}

function preHeaderDropdownToggleId(actionIndex: number): string {
    return `qld-header-pre-header-dropdown-${actionIndex}`;
}

function resolvePreHeaderDropdownLabel(action: HeaderPreHeaderAction): string {
    const dropdown = action.dropdown;
    if (!dropdown || dropdown.type === 'none') {
        return '';
    }
    return dropdown.text?.trim() || action.text?.trim() || '';
}

function renderPreHeaderDropdownList(dropdown: HeaderPreHeaderActionDropdown, actionIndex: number, editMode?: boolean): string {
    const items = dropdown.items ?? [];
    const itemsHtml = items
        .map(
            (item, itemIndex) => html`
        <li>
          <a
            class="qld-header-link dropdown-item "
            href="${xssSafeContent(squizLinkHref(item))}"
            ${item.target ? `target="${xssSafeContent(item.target)}"` : ''}
            ${editorSqField(editMode, `preHeader.actions[${actionIndex}].dropdown.items[${itemIndex}]`)}
          >
            ${xssSafeContent(squizLinkLabel(item))}
          </a>
        </li>
      `,
        )
        .join('');

    const viewMore = dropdown.viewMore;
    const viewMoreHtml = hasSquizLinkContent(viewMore)
        ? html`
        <li>
          <a
            href="${xssSafeContent(squizLinkHref(viewMore))}"
            ${viewMore?.target ? `target="${xssSafeContent(viewMore?.target)}"` : ''}
            class="qld-header-link dropdown-item border-bottom-0"
            ${editorSqField(editMode, `preHeader.actions[${actionIndex}].dropdown.viewMore`)}
          >
            ${xssSafeContent(squizLinkLabel(viewMore))}
          </a>
        </li>
      `
        : '';

    return html`
    <ul class="dropdown-menu dropdown-menu-end">
      ${itemsHtml}${viewMoreHtml}
    </ul>
  `;
}

function renderPreHeaderAction(action: HeaderPreHeaderAction, actionIndex: number, editMode?: boolean): string {
    const actionBase = `preHeader.actions[${actionIndex}]`;

    if (action.dropdown && action.dropdown.type !== 'none') {
        const dropdown = action.dropdown;
        const listMenu = dropdown.type === 'list' ? renderPreHeaderDropdownList(dropdown, actionIndex, editMode) : '';
        // HTML/form dropdown: raw HTMLContent (no xssSafeContent) — see header README § HTML / form dropdown markup (XSS).
        const htmlMenu = isHtmlOrFormDropdown(dropdown)
            ? html`
          <div
            class="dropdown-menu dropdown-menu-end"
            ${editorSqField(editMode, `${actionBase}.dropdown.HTMLContent`)}
          >
            ${dropdown.HTMLContent ?? ''}
          </div>
        `
            : '';

        return html`
      <div class="dropdown">
        <a
          id="${xssSafeContent(preHeaderDropdownToggleId(actionIndex))}"
          role="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          class="qld-header-link dropdown-toggle"
          href="#"
        >
          <span ${editorSqField(editMode, `${actionBase}.dropdown.text`)}
            >${xssSafeContent(resolvePreHeaderDropdownLabel(action))}</span
          >
        </a>
        ${listMenu}${htmlMenu}
      </div>
    `;
    }

    const link = action.dropdown?.link;
    const href = squizLinkHref(link);
    const label = squizLinkLabel(link);
    const icon = resolvePreHeaderActionIcon(action);

    return html`
    <a
      class="qld-header-link ms-16"
      href="${xssSafeContent(href)}"
      ${link?.target ? `target="${xssSafeContent(link.target)}"` : ''}
      ${editorSqField(editMode, `${actionBase}.dropdown.link`)}
    >
      ${
          icon
              ? html`<span
            class="qld-icon qld-icon-${xssSafeContent(icon)} qld-icon-sm qld-header-link-icon"
            aria-hidden="true"
            ${editorSqField(editMode, `${actionBase}.dropdown.icon`)}
          ></span>`
              : ''
      }<span>${xssSafeContent(label)}</span>
    </a>
  `;
}

function renderPreHeaderGlobalLogo(hasDeliveringForQLDLogo: boolean): string {
    if (hasDeliveringForQLDLogo) {
        return renderCoaLogo({
            logo: 'coa-delivering-for-qld',
            className: 'qld-header-logo is-delivering-for-qld',
            fill: 'currentColor',
        });
    }
    return renderCoaLogo({
        className: 'qld-header-logo',
        fill: 'currentColor',
    });
}

function renderGlobalLink(input: HeaderInput, editMode?: boolean): string {
    const preHeader = input.preHeader ?? {};
    const globalLink = preHeader.globalLink;
    const {url: globalUrl, text: globalText} = resolvePreHeaderGlobalLink(globalLink);

    return html`
    <a
      class="qld-header-link align-self-center"
      href="${xssSafeContent(globalUrl)}"
      ${globalLink?.target ? `target="${xssSafeContent(globalLink.target)}"` : ''}
      ${editorSqField(editMode, 'preHeader.globalLink')}
    >
      <span class="d-none d-lg-inline">${xssSafeContent(globalText)}</span>
      ${renderPreHeaderGlobalLogo(Boolean(input.hasDeliveringForQLDLogo))}
    </a>
  `;
}

export function renderPreHeader({input, editMode}: RenderHeaderBannerOptions): string {
    const preHeader = input.preHeader ?? {};
    const assets = input.assets ?? {};
    const siteSearch = assets.siteSearch;
    const brandLayout = resolveBrandLayout(input);
    const preHeaderClass = resolvePreHeaderPaletteClass(brandLayout);
    const actions = preHeader.actions ?? [];
    const actionsHtml = actions.map((action, index) => renderPreHeaderAction(action, index, editMode)).join('');
    const showSearch = shouldShowSiteSearch(siteSearch);

    return html`
    <div class="qld-header-pre-header ${preHeaderClass}">
      <div class="container">
        <div class="d-flex justify-content-between">
          ${renderGlobalLink(input, editMode)}
          ${
              actions.length > 0
                  ? html`
                <div class="d-none d-lg-flex align-items-baseline">
                  ${actionsHtml}
                </div>
              `
                  : ''
          }
          <div class="qld-header-mobile-controls">
            ${
                showSearch
                    ? html`
                  <button
                    id="qld-header-toggle-search-button"
                    aria-controls="qld-header-search"
                    class="qld-header-mobile-button is-search-toggle"
                    aria-expanded="false"
                    aria-label="Open search"
                  >
                    Search
                  </button>
                `
                    : ''
            }
            <button
              id="burgerBtn"
              class="qld-header-mobile-button is-menu-toggle"
              data-bs-toggle="collapse"
              data-bs-target="#main-nav"
              aria-controls="main-nav"
              aria-expanded="false"
              aria-label="Open menu"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
