import {html} from '../../../utils/html.js';
import {xssSafeContent} from '../../../utils/xss.js';
import {squizImageAlt, squizImageSrc} from '../../../utils/squizImage';
import {editorSqField} from './editorSqField';
import {renderCoaLogo} from '../../../utils/logo/renderCoaLogo';
import {resolveBrandContent} from './resolveBrandContent';
import type {BrandLayout, HeaderInput, HeaderMainContent} from './types';

export interface RenderHeaderBrandOptions {
    input: HeaderInput;
    mainContent: HeaderMainContent;
    url: string;
    linkTarget?: string;
    brandLayout: BrandLayout;
    editMode?: boolean;
}

function renderPrimaryLockup(resolved: ReturnType<typeof resolveBrandContent>, editMode?: boolean): string {
    const {primaryImage, primaryCoa} = resolved;
    const primarySrc = squizImageSrc(primaryImage);

    if (primarySrc) {
        const alt = squizImageAlt(primaryImage, 'Queensland government');
        return html`<img
      src="${xssSafeContent(primarySrc)}"
      height="56"
      alt="${xssSafeContent(alt)}"
      ${editorSqField(editMode, 'mainContent.logo')}
    />`;
    }

    const coaClassName = primaryCoa === 'coa-delivering-for-qld' || primaryCoa === 'coa-master-brand' ? 'qld-header-logo is-delivering-for-qld' : 'qld-header-logo';

    return renderCoaLogo({
        logo: primaryCoa,
        height: 56,
        className: coaClassName,
        fill: 'currentColor',
    });
}

function renderSecondaryLockup(resolved: ReturnType<typeof resolveBrandContent>, editMode?: boolean): string {
    const secondarySrc = squizImageSrc(resolved.secondaryImage);
    if (secondarySrc) {
        return html`
      <div class="qld-header-secondary-content">
        <img
          src="${xssSafeContent(secondarySrc)}"
          class="qld-header-secondary-image qld-header-logo"
          height="56"
          alt="${xssSafeContent(squizImageAlt(resolved.secondaryImage, `${resolved.siteTitle ?? ''}${resolved.subline ?? ''}`))}"
          ${editorSqField(editMode, 'mainContent.secondaryLogo')}
        />
      </div>
    `;
    }

    if (!resolved.siteTitle?.trim()) {
        return '';
    }

    return html`
    <div class="qld-header-secondary-content">
      <span
        class="qld-header-site-title"
        ${editorSqField(editMode, 'mainContent.siteTitle')}
        >${xssSafeContent(resolved.siteTitle)}</span
      >
      ${
          resolved.subline?.trim()
              ? html`<span
            class="qld-header-subline"
            ${editorSqField(editMode, 'mainContent.subline')}
            >${xssSafeContent(resolved.subline)}</span
          >`
              : ''
      }
    </div>
  `;
}

export function renderHeaderBrand({input, mainContent, url, linkTarget, brandLayout, editMode}: RenderHeaderBrandOptions): string {
    const resolved = resolveBrandContent(brandLayout, input, mainContent);
    const secondaryHtml = renderSecondaryLockup(resolved, editMode);

    return html`
    <div class="${xssSafeContent(resolved.brandClassNames)}">
      <a
        class="qld-header-link d-lg-inline-flex align-middle"
        href="${xssSafeContent(url)}"
        ${linkTarget ? `target="${xssSafeContent(linkTarget)}"` : ''}
        ${editorSqField(editMode, 'mainContent.url')}
      >
        <div class="qld-header-brand-image align-self-center">
          ${renderPrimaryLockup(resolved, editMode)}
        </div>
        ${secondaryHtml}
      </a>
    </div>
  `;
}
