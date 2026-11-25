import {html} from '../../../utils/html.js';
import {xssSafeContent} from '../../../utils/xss.js';
import {hasSquizLinkContent, squizLinkLabel} from '../../../utils/squizLink.js';
import type {SquizLink} from '../../../types/squiz.js';
import {renderCoaLogo} from '../../../utils/logo/renderCoaLogo.js';
import {
    DEFAULT_ACKNOWLEDGEMENT_HEADING,
    DEFAULT_ACKNOWLEDGEMENT_PARAGRAPH,
    DEFAULT_CONTACT_BUTTON,
    DEFAULT_CONTACT_CONTENT,
    DEFAULT_CONTACT_LIST,
    DEFAULT_CONTACT_TITLE,
    DEFAULT_COPYRIGHT_TEXT,
    DEFAULT_GOVERNMENT_LINKS,
    ORGANISATION_LINK_TEXT,
    ORGANISATION_LINK_URL,
} from './defaults.js';
import {editorSqField, escapeAttribute, hasSafeLinkUrl, linkHref, linkTargetAttribute} from '../../../utils/attributes.js';
import type {FooterContact, FooterContactDetail, FooterCopyright, FooterFollowLink, FooterInput, FooterLinkColumn, FooterLogo, FooterOptionalColumn} from '../types.js';

const CONTACT_TYPES = ['phone', 'email'] as const;
const SOCIAL_ICONS = ['facebook', 'instagram', 'linkedin', 'x', 'youtube'] as const;

function isAllowed<T extends string>(value: string | undefined, allowed: readonly T[]): value is T {
    return allowed.includes(value as T);
}

/** Sanitised link text (SquizLink `text`), with a fallback. */
function linkText(link: SquizLink | undefined, fallback = ''): string {
    return xssSafeContent(squizLinkLabel(link, fallback));
}

/**
 * A government or custom link renders only with a safe URL and a visible label. An asset
 * pick with no URL (or no name) would render a dead or empty anchor, so it is dropped.
 */
function isRenderableLink(link: SquizLink | undefined): boolean {
    return hasSafeLinkUrl(link) && Boolean(squizLinkLabel(link).trim());
}

function renderLinkItem(link: SquizLink): string {
    return html`<li><a class="nav-link" href="${linkHref(link)}"${linkTargetAttribute(link)}>${linkText(link)}</a></li>`;
}

function renderSitename(sitename: string | undefined, editMode: boolean): string {
    const name = sitename?.trim();
    if (!name) {
        return '';
    }
    return html`
    <div class="row">
      <div class="col title">
        <h2 class="footer-site-name"${editorSqField(editMode, 'sitename')}>${xssSafeContent(name)}</h2>
      </div>
    </div>`;
}

function renderContactItem(detail: FooterContactDetail): string {
    if (!isAllowed(detail.type, CONTACT_TYPES)) {
        return '';
    }
    return html`<div class="footer-contact-item footer-contact-${detail.type}"><span class="qld-icon qld-icon-${detail.type}" aria-hidden="true"></span> ${xssSafeContent(detail.label ?? '')}</div>`;
}

function renderContact(contact: FooterContact | undefined, editMode: boolean): string {
    const title = contact?.title?.trim() || DEFAULT_CONTACT_TITLE;
    const content = contact?.content?.trim() ? xssSafeContent(contact.content) : DEFAULT_CONTACT_CONTENT;

    const button = hasSquizLinkContent(contact?.button) ? contact?.button : DEFAULT_CONTACT_BUTTON;
    const buttonHref = linkHref(button, 'https://www.qld.gov.au/contact-us');
    const buttonLabel = linkText(button, DEFAULT_CONTACT_BUTTON.text);

    const showList = contact?.showList !== false;
    const details = contact?.list?.length ? contact.list : DEFAULT_CONTACT_LIST;
    const list = showList ? details.map(renderContactItem).join('') : '';

    // The contact column has no divider. The QGDS layout only divides the government links and optional columns.
    return html`
    <div class="col-12 col-lg-3 py-24 py-lg-0 footer-contact">
      <div class="row">
        <div class="col col-lg-12">
          <h3 class="footer-heading">${xssSafeContent(title)}</h3>
          <div${editorSqField(editMode, 'contact.content')}>${content}</div>
        </div>
        <div class="col col-lg-12 contact-btn order-lg-last d-flex d-lg-block mt-lg-32 ">
          <a href="${buttonHref}" class="btn btn-outline-secondary"${linkTargetAttribute(button)}${editorSqField(editMode, 'contact.button')}>${buttonLabel}</a>
        </div>
        <div class="col-12">${list}</div>
      </div>
    </div>`;
}

function renderGovernmentLinks(footerLinks: FooterLinkColumn | undefined): string {
    // Entries without a URL or label are dropped. If none are left, the defaults show.
    const usable = footerLinks?.list?.filter(isRenderableLink);
    const authored = usable?.length ? usable : undefined;
    const items = (authored ?? DEFAULT_GOVERNMENT_LINKS).map(renderLinkItem).join('');
    const listClass = authored ? 'nav footer-link-list flex-column pt-lg-2' : 'nav footer-link-list flex-column';

    // Fixed divider, as in the Storybook default.
    return html`
    <nav class="col-12 col-lg-2 border-column" aria-label="Footer navigation">
      <div class="footer-column pe-lg-16">
        <ul class="${listClass}">${items}</ul>
      </div>
    </nav>`;
}

function renderFollowItem(item: FooterFollowLink): string {
    const icon = isAllowed(item.icon, SOCIAL_ICONS) ? item.icon : undefined;
    const iconSpans = icon
        ? html`<span class="qld-icon qld-icon-md qld-icon-${icon} d-lg-none" aria-hidden="true"></span><span class="qld-icon qld-icon-sm qld-icon-${icon} d-none d-lg-block" aria-hidden="true"></span>`
        : '';
    const label = linkText(item.link);
    const accessibleLabel = item.accessibleLabel?.trim() ? xssSafeContent(item.accessibleLabel) : label;

    return html`<li><a class="nav-link" href="${linkHref(item.link)}"${linkTargetAttribute(item.link)}>${iconSpans}<span class="nav-link-label d-none d-lg-block">${label}</span><span class="sr-only">${accessibleLabel}</span></a></li>`;
}

function renderFollowLinks(items: FooterFollowLink[] | undefined): string {
    // A social link is its icon, so it needs a safe URL. An asset pick with no URL is dropped.
    const rendered = (items ?? [])
        .filter((item) => hasSafeLinkUrl(item.link))
        .map(renderFollowItem)
        .join('');
    return rendered ? html`<ul class="nav footer-link-list footer-link-list--social">${rendered}</ul>` : '';
}

function renderCustomLinks(links: SquizLink[] | undefined): string {
    const usable = links?.filter(isRenderableLink) ?? [];
    if (!usable.length) {
        return '';
    }
    return html`<ul class="nav footer-link-list footer-link-list--custom flex-column">${usable.map(renderLinkItem).join('')}</ul>`;
}

/**
 * An optional column renders only when it has content, social links or custom links.
 * The nav landmark wraps the link lists only. The heading and text content sit outside it.
 */
function renderOptionalColumn(column: FooterOptionalColumn | undefined, index: 1 | 2): string {
    const content = column?.content?.trim() ?? '';
    const follow = renderFollowLinks(column?.followLinks);
    const custom = renderCustomLinks(column?.customLinks);
    if (!content && !follow && !custom) {
        return '';
    }

    const title = column?.title?.trim();
    const padding = index === 1 ? 'pe-16' : 'pe-lg-16';
    const ariaLabel = escapeAttribute(title || 'Footer links');
    const links = follow || custom ? html`<nav aria-label="${ariaLabel}">${follow}${custom}</nav>` : '';

    // Fixed divider, as in the Storybook default.
    return html`
    <div class="col-12 col-lg-2 optional-column-${index} border-column">
      <div class="footer-column ${padding}">
        ${title ? html`<h3 class="footer-heading">${xssSafeContent(title)}</h3>` : ''}
        <div class="footer-content">
          ${content ? xssSafeContent(content) : ''}
          ${links}
        </div>
      </div>
    </div>`;
}

function renderAcknowledgements(acknowledgement: string | undefined): string {
    const content = acknowledgement?.trim() ? xssSafeContent(acknowledgement) : html`<p>${DEFAULT_ACKNOWLEDGEMENT_PARAGRAPH}</p>`;
    return html`<div class="footer-acknowledgements"><h3 class="footer-heading">${DEFAULT_ACKNOWLEDGEMENT_HEADING}</h3>${content}</div>`;
}

/** Coat of Arms only. The spec defines no custom logo. */
function renderLogo(footerLogo: FooterLogo | undefined): string {
    if (!footerLogo?.show) {
        return '';
    }
    return html`<div class="footer-crest">${renderCoaLogo({logo: 'coa-landscape'})}</div>`;
}

function renderCopyright(copyright: FooterCopyright | undefined, editMode: boolean): string {
    const base = copyright?.content?.trim() ? xssSafeContent(copyright.content) : DEFAULT_COPYRIGHT_TEXT;
    // ForGov checkpoint 34 format: "yyyy–yyyy" (en dash, no spaces).
    const from = copyright?.yearFrom?.trim() ? `${xssSafeContent(copyright.yearFrom)}–` : '';
    const year = String(new Date().getFullYear());
    return html`<p class="copyright"><span${editorSqField(editMode, 'copyright.content')}>${base}</span> ${from}${year}</p>`;
}

/** Always rendered. The QGDS spec requires this link as the last government link. */
function renderOrganisationLink(): string {
    return html`<p><a class="fw-semibold" href="${ORGANISATION_LINK_URL}" rel="external">${ORGANISATION_LINK_TEXT}</a></p>`;
}

function renderLegalColumn(input: FooterInput, editMode: boolean): string {
    return html`
    <div class="col crest">
      <div class="footer-column">
        <div class="footer-content">
          ${renderAcknowledgements(input.acknowledgement)}
          ${renderLogo(input.footerLogo)}
          ${renderCopyright(input.copyright, editMode)}
          ${renderOrganisationLink()}
        </div>
      </div>
    </div>`;
}

/** Edge markup for the footer, ported from `footer.hbs`. Input must already have Matrix SquizLinks resolved. */
export function renderFooter(input: FooterInput, editMode: boolean): string {
    const variantClass = input.variant === 'dark' ? ' dark' : input.variant === 'dark-alt' ? ' dark-alt' : '';

    return html`
    <footer class="qld-footer${variantClass}" role="contentinfo">
      <div class="container">
        ${renderSitename(input.sitename, editMode)}
        <div class="row">
          ${renderContact(input.contact, editMode)}
          ${renderOptionalColumn(input.optionalColumn1, 1)}
          ${renderGovernmentLinks(input.footerLinks)}
          ${renderOptionalColumn(input.optionalColumn2, 2)}
          ${renderLegalColumn(input, editMode)}
        </div>
      </div>
    </footer>`;
}
