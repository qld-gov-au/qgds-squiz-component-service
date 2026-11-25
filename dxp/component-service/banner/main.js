/**
 * Banner component
 */

// Shared HTML template tag and XSS filter (see docs/CODING_STANDARDS.md).
import {html} from '../../utils/html';
import {xssSafeContent} from '../../utils/xss';
import {resolveBreadcrumbs} from '../../utils/matrix/siteLineage/resolveBreadcrumbs.ts';
import {resolveCtxAssetId, resolveCtxPageUrl} from '../../utils/matrix/pageUrl/index.ts';
import {isLocalDevRuntime} from '../header/lib/localDevRuntime.ts';
import {resolveSquizLink, squizLinkHref, squizLinkLabel} from '../../utils/squizLink.ts';

const CTA_TYPES = ['buttons', 'cards', 'cards-mixed'];
const MIXED_CARD_CLASSES = ['card-default default', 'card-dark dark', 'card-dark-alt dark-alt'];

/**
 * Escape a value for a double-quoted HTML attribute.
 * xssSafeContent filters tags only, so it does not stop a quote from closing an attribute.
 */
function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_SCHEME_PATTERN = /^(https?|mailto|tel):/i;

/**
 * Return the URL when it is safe for an href or image source, or "" when it is not.
 * Allows http(s), mailto, tel, and relative or anchor URLs.
 */
function safeUrl(url) {
    const value = String(url ?? '').trim();
    if (!value) {
        return '';
    }

    // Browsers ignore control characters and whitespace inside a scheme,
    // so strip them before checking.
    // eslint-disable-next-line no-control-regex -- intentional: strip control characters before the scheme check
    const probe = value.replace(/[\u0000-\u0020\u007f]/g, '');
    if (SCHEME_PATTERN.test(probe) && !SAFE_SCHEME_PATTERN.test(probe)) {
        return '';
    }

    return value;
}

const TARGET_PATTERN = /^[a-z0-9_-]+$/i;

/** Return the window target when it is a plain token, or "" when it is not. */
function safeTarget(target) {
    const value = String(target ?? '').trim();
    return TARGET_PATTERN.test(value) ? value : '';
}

/**
 * Build a CSS url() value with a quoted and CSS-escaped URL.
 * Pass the result through escapeAttribute when it goes into a style attribute.
 */
function cssUrl(url) {
    const value = String(url ?? '').replace(/[\\"\n\r\f]/g, (char) => `\\${char.codePointAt(0).toString(16)} `);
    return `url("${value}")`;
}

/** Matrix editor `data-sq-field` path. Rendered only in edit mode. */
function editorSqField(editMode, fieldPath) {
    return editMode ? `data-sq-field="${escapeAttribute(fieldPath)}"` : '';
}

/**
 * Breadcrumb items from the Matrix site lineage. This is the same data source
 * as the standalone breadcrumbs component.
 *
 * Live pages with no placement get no trail. Editor, local dev (`IS_LOCAL`)
 * and Storybook (no utilities) get the preview trail from the lineage fixture.
 * Returns "" when there is nothing to show.
 */
async function renderBreadcrumbs(componentUtilities, editMode) {
    const placed = Boolean(resolveCtxAssetId(componentUtilities) || resolveCtxPageUrl(componentUtilities));
    const previewMode = editMode || isLocalDevRuntime(componentUtilities);
    if (componentUtilities && !placed && !previewMode) {
        return '';
    }

    const trail = await resolveBreadcrumbs(componentUtilities);
    if (!Array.isArray(trail) || trail.length === 0) {
        return '';
    }

    const lastIndex = trail.length - 1;
    return trail
        .map((item, index) => {
            // Titles are text, so escape them fully rather than filtering tags only.
            const title = escapeAttribute(item?.title ?? '');
            if (index === lastIndex) {
                return html`<li class="breadcrumb-item active" aria-current="page">
          ${title}
        </li>`;
            }

            const href = safeUrl(item?.url);
            return href
                ? html`<li class="breadcrumb-item">
            <a href="${escapeAttribute(href)}">${title}</a>
          </li>`
                : html`<li class="breadcrumb-item">${title}</li>`;
        })
        .join('');
}

/**
 * Resolve Matrix asset picker links and keep only items with a usable URL.
 * Each item keeps its manifest index, so data-sq-field paths and the mixed
 * card colours do not shift when an earlier item is dropped.
 * In edit mode, items without a URL are kept so the editor can fix them.
 */
async function resolveCtaItems(ctaItems, info, editMode) {
    if (!Array.isArray(ctaItems)) {
        return [];
    }

    const resolved = await Promise.all(
        ctaItems.map(async (item, index) => {
            if (!item) {
                return null;
            }

            const link = (await resolveSquizLink(item.link, info)) ?? {};
            const href = safeUrl(squizLinkHref(link, ''));
            if (!href && !editMode) {
                return null;
            }

            return {
                index,
                link,
                href: href || '#',
                variantClass: item.variantClass ?? '',
            };
        }),
    );

    return resolved.filter(Boolean);
}

function renderCtaButton({index, link, href, variantClass}, editMode) {
    const label = squizLinkLabel(link);
    return html`
    <a
      ${editorSqField(editMode, `ctaItems[${index}].link.url`)}
      class="btn ${escapeAttribute(variantClass)}"
      href="${escapeAttribute(href)}"
      target="${escapeAttribute(safeTarget(link.target))}"
      aria-label="${escapeAttribute(label)}"
    >
      ${
          variantClass === 'btn-secondary'
              ? html`<span
            class="qld-icon qld-icon-md qld-icon-external-link leading"
            aria-hidden="true"
          ></span>`
              : ''
      }
      <span
        class="btn-label-default"
        ${editorSqField(editMode, `ctaItems[${index}].link.text`)}
        >${xssSafeContent(label)}</span
      >
    </a>
  `;
}

function renderCtaCard({index, link, href}, mixedClass, editMode) {
    const label = squizLinkLabel(link);
    return html`
    <div class="col">
      <div
        class="card card-default default card-single-action card-arrow ${escapeAttribute(mixedClass)}"
      >
        <div class="card-body">
          <h3
            class="card-title"
            ${editorSqField(editMode, `ctaItems[${index}].link.text`)}
          >
            <a
              ${editorSqField(editMode, `ctaItems[${index}].link.url`)}
              href="${escapeAttribute(href)}"
              target="${escapeAttribute(safeTarget(link.target))}"
              class="stretched-link"
              >${xssSafeContent(label)}</a
            >
          </h3>
          <div
            class="qld-icon qld-icon-md qld-icon-arrow-right"
            aria-hidden="true"
          ></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Banner component
 */
export default {
    async main(input, componentUtilities) {
        const {generalSettings, textContent, backgroundType, callToAction, bannerImageField, imageClasses, ctaItems} = input || {};

        const editMode = Boolean(componentUtilities?.ctx?.editor);
        const title = String(textContent?.title ?? '').trim();

        // Live output needs a title. Edit mode keeps the markup so the editor can type one.
        if (!title && !editMode) {
            return '';
        }

        const breadcrumbs = generalSettings?.showBreadcrumbs ? await renderBreadcrumbs(componentUtilities, editMode) : '';

        const ctaType = CTA_TYPES.includes(callToAction) ? callToAction : '';
        const resolvedCtaItems = ctaType ? await resolveCtaItems(ctaItems, componentUtilities, editMode) : [];

        const squizImage = bannerImageField?.squizImageField;
        const imageUrl = safeUrl(squizImage?.imageVariations?.original?.url);
        const imageAlt = squizImage?.alt ?? '';
        const showImage = backgroundType === 'with-hero-image' && generalSettings?.bannerType !== 'no-banner' && (Boolean(imageUrl) || editMode);
        const imageStyle = imageUrl ? `style="${escapeAttribute(`background-image:${cssUrl(imageUrl)}`)}"` : '';
        const imageRole = imageAlt ? `role="img" aria-label="${escapeAttribute(imageAlt)}"` : `aria-hidden="true"`;

        return html`
      <div
        class="qld-banner qld-banner-grid ${escapeAttribute(generalSettings?.bannerType)} ${escapeAttribute(backgroundType)} ${escapeAttribute(
            generalSettings?.variantClass,
        )} ${escapeAttribute(generalSettings?.wrapperClasses)}"
      >
        <div class="container-fluid">
          <div class="banner-inner">
            ${
                breadcrumbs
                    ? html`<div class="banner-breadcrumbs">
                  <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                      ${breadcrumbs}
                    </ol>
                  </nav>
                </div>`
                    : ''
            }
            <div class="banner-content">
              <h1
                class="banner-title-wrap ${textContent?.blockTitle ? 'as-block' : ''}"
              >
                <span
                  class="banner-title"
                  ${editorSqField(editMode, 'textContent.title')}
                  >${xssSafeContent(title)}</span
                >
                ${
                    textContent?.subtitle || editMode
                        ? html`<span
                      class="banner-subtitle"
                      ${editorSqField(editMode, 'textContent.subtitle')}
                      >${xssSafeContent(textContent?.subtitle ?? '')}</span
                    >`
                        : ''
                }
              </h1>
              ${
                  textContent?.abstract || editMode
                      ? html`<div
                    class="banner-abstract"
                    ${editorSqField(editMode, 'textContent.abstract')}
                  >
                    ${xssSafeContent(textContent?.abstract ?? '')}
                  </div>`
                      : ''
              }
              ${
                  resolvedCtaItems.length
                      ? html`<div
                    class="banner-cta"
                    role="group"
                    aria-label="Available options"
                  >
                    ${
                        ctaType === 'buttons'
                            ? html`<div class="cta-buttons">
                          ${resolvedCtaItems.map((item) => renderCtaButton(item, editMode)).join('')}
                        </div>`
                            : ''
                    }
                    ${
                        ctaType === 'cards'
                            ? html`<div class="cta-cards">
                          ${resolvedCtaItems.map((item) => renderCtaCard(item, '', editMode)).join('')}
                        </div>`
                            : ''
                    }
                    ${
                        ctaType === 'cards-mixed'
                            ? html`<div class="cta-cards">
                          ${resolvedCtaItems.map((item) => renderCtaCard(item, MIXED_CARD_CLASSES[item.index % MIXED_CARD_CLASSES.length], editMode)).join('')}
                        </div>`
                            : ''
                    }
                  </div>`
                      : ''
              }
            </div>
            ${
                showImage
                    ? html`<div
                  class="banner-image ${escapeAttribute(imageClasses)} ${imageClasses === 'align-right-with-gradient' ? 'align-right with-gradient' : ''}"
                >
                  <div
                    class="banner-image-inner"
                    ${imageStyle}
                    ${imageRole}
                    ${editorSqField(editMode, 'bannerImageField.squizImageField')}
                  ></div>
                </div>`
                    : ''
            }
          </div>
        </div>
      </div>
    `;
    },
};
