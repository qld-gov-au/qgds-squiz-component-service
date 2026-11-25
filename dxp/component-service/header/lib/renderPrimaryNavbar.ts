import {html} from '../../../utils/html.js';
import {xssSafeContent} from '../../../utils/xss.js';
import type {NavbarChildItem, NavbarMetadata, NavbarNavigationItem} from './navbarTypes';
import {editorSqField} from './editorSqField';
import type {RenderPrimaryNavbarOptions} from './types';

function targetRelAttrs(target?: string): string {
    if (target === '_blank') {
        return ' target="_blank" rel="noopener noreferrer"';
    }
    if (target) {
        return ` target="${xssSafeContent(target)}"`;
    }
    return '';
}

function renderNavLinkLabel(item: Pick<NavbarNavigationItem, 'text' | 'iconName' | 'hideLabel'>): string {
    const text = item.text ?? '';
    if (item.iconName) {
        const iconClass = item.iconName.startsWith('qld-icon') ? item.iconName : `qld-icon-${item.iconName}`;
        if (item.hideLabel) {
            return html`
        <span class="qld-icon qld-icon-md ${xssSafeContent(iconClass)}" aria-hidden="true"></span>
        <span class="visually-hidden-lg">${xssSafeContent(text)}</span>
      `;
        }
        return html`
      <span class="qld-icon qld-icon-md ${xssSafeContent(iconClass)}" aria-hidden="true"></span>${xssSafeContent(text)}
    `;
    }
    return xssSafeContent(text);
}

function renderDropdownChild(child: NavbarChildItem, parentCurrentPage?: boolean): string {
    const current = child.currentPage ?? parentCurrentPage;
    if (child.isHTML) {
        return html`
      <li${child.mobileOnly ? ` class="mobile-only"` : ''}>
        ${xssSafeContent(child.htmlContent ?? '')}
      </li>
    `;
    }

    return html`
    <li${child.mobileOnly ? ` class="mobile-only"` : ''}>
      <a
        class="dropdown-item"
        href="${xssSafeContent(child.url ?? '#')}"
        ${current ? ' aria-current="page"' : ''}
        ${targetRelAttrs(child.target)}
        >${xssSafeContent(child.text ?? '')}</a
      >
      ${child.description ? html`<p>${xssSafeContent(child.description)}</p>` : ''}
    </li>
  `;
}

function renderDropdownItem(item: NavbarNavigationItem, metadata: NavbarMetadata): string {
    const dropdown = item.dropdownOptions ?? {};
    const vertical = Boolean(metadata.verticalOrientation);
    const hasNoLink = Boolean(dropdown.hasNoLink);
    const href = hasNoLink ? '#' : xssSafeContent(item.url ?? '#');
    const expandedOnMobile = item.isExpandedOnMobile ? ' data-is-expanded-on-mobile="true"' : '';

    const parentLink = !dropdown.hasNoLink
        ? html`
        <li>
          <a
            class="dropdown-item parent-link"
            href="${xssSafeContent(item.url ?? '#')}"
            ${item.currentPage ? ' aria-current="page"' : ''}
            ${targetRelAttrs(item.target)}
            >${xssSafeContent(dropdown.alternativeText?.trim() ? dropdown.alternativeText : (item.text ?? ''))}</a
          >
          ${dropdown.description ? html`<p>${xssSafeContent(dropdown.description)}</p>` : ''}
        </li>
      `
        : '';

    const children = (item.navigationItems ?? []).map((child) => renderDropdownChild(child, item.currentPage)).join('');

    const viewAllLabel = dropdown.viewAllLabel?.trim() || (dropdown.viewAllHref ? 'View all' : '');
    const viewAll = dropdown.viewAllHref
        ? html`
        <li>
          <a
            class="dropdown-item view-all"
            ${item.currentPage ? ' aria-current="page"' : ''}
            href="${xssSafeContent(dropdown.viewAllHref)}"
            >${xssSafeContent(viewAllLabel)}</a
          >
        </li>
      `
        : '';

    return html`
    <li
      class="nav-item dropdown${item.alternativeColor ? ' alt' : ''}${item.mobileOnly ? ' mobile-only' : ''}"
      ${expandedOnMobile}
    >
      <a
        class="nav-link${vertical ? '' : ' dropdown-toggle'}${item.currentPage ? ' active' : ''}${hasNoLink ? ' hasNoLink' : ''}"
        ${item.currentPage ? ' aria-current="page"' : ''}
        href="${href}"
        ${targetRelAttrs(item.target)}
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        ${renderNavLinkLabel(item)}
      </a>
      <button
        class="nav-link dropdown-toggle"
        ${item.currentPage ? ' aria-current="page"' : ''}
        data-bs-toggle="dropdown"
        data-bs-auto-close="false"
        aria-expanded="false"
        aria-selected="false"
        aria-label="Toggle navigation"
      >
        <span class="visually-hidden">Expand</span>
      </button>
      <ul class="dropdown-menu">
        ${parentLink}${children}${viewAll}
      </ul>
    </li>
  `;
}

function renderSimpleNavItem(item: NavbarNavigationItem): string {
    return html`
    <li
      class="nav-item${item.alternativeColor ? ' alt' : ''}${item.mobileOnly ? ' mobile-only' : ''}"
    >
      <a
        class="nav-link${item.currentPage ? ' active' : ''}"
        ${item.currentPage ? ' aria-current="page"' : ''}
        href="${xssSafeContent(item.url ?? '#')}"
        ${targetRelAttrs(item.target)}
      >
        ${renderNavLinkLabel(item)}
      </a>
    </li>
  `;
}

function renderNavItem(item: NavbarNavigationItem, metadata: NavbarMetadata): string {
    if (item.navigationItems && item.navigationItems.length > 0) {
        return renderDropdownItem(item, metadata);
    }
    return renderSimpleNavItem(item);
}

const DEFAULT_METADATA: NavbarMetadata = {
    alternativeColor: false,
    verticalOrientation: false,
    navbarBrandName: 'Menu',
};

/** Primary site navigation markup (parity with `navbar.hbs`). */
export function renderPrimaryNavbar(options: RenderPrimaryNavbarOptions = {}): string {
    const metadata = {...DEFAULT_METADATA, ...options.metadata};
    const navigation = options.navigation ?? [];
    const editMode = options.editMode;
    const navId = options.navigationId?.trim() || 'main-nav';

    if (!Array.isArray(navigation) || navigation.length === 0) {
        return '';
    }

    const navClasses = ['navbar', 'navbar-expand-lg', metadata.alternativeColor ? 'dark' : '', metadata.verticalOrientation ? 'vertical' : ''].filter(Boolean).join(' ');

    const brandName = metadata.navbarBrandName?.trim() ?? '';
    const itemsHtml = navigation.map((item) => renderNavItem(item, metadata)).join('');

    return html`
    <nav
      id="${xssSafeContent(navId)}"
      class="${navClasses}"
      aria-label="Website navigation"
      role="navigation"
      ${editorSqField(editMode, 'componentAdvancedOptions.id')}
    >
      <div id="navbarNav" class="container">
        <div class="nav-header">
          <span class="navbar-brand" href="#">${xssSafeContent(brandName)}</span>
          <button
            id="burgerCloseBtn"
            type="button"
            class="navbar-btn"
            data-bs-toggle="collapse"
            aria-label="Close"
            data-bs-target="#main-nav"
            aria-expanded="false"
            aria-controls="collapseExample"
          >
            Close
          </button>
        </div>
        <div class="navbar-collapse">
          <ul class="navbar-nav">${itemsHtml}</ul>
        </div>
      </div>
      <div id="overlay"></div>
    </nav>
  `;
}
