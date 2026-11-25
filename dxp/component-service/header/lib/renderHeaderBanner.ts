import {html} from '../../../utils/html.js';
import {xssSafeContent} from '../../../utils/xss.js';
import {editorSqField} from './editorSqField';
import {renderHeaderBrand} from './renderHeaderBrand';
import {resolveHeaderAutosuggestUrl} from './resolveHeaderAutosuggestUrl';
import {renderHeaderSearchInner, resolveSearchResultsUrl, shouldShowSiteSearch} from './renderHeaderSearch';
import {squizLinkHref} from '../../../utils/squizLink.js';
import {resolveMainPaletteClass} from './resolveBrandPalettes';
import {resolveBrandLayout} from './resolveBrandLayout';
import type {RenderHeaderBannerOptions} from './types';

export function renderHeaderBanner({input, editMode, info}: RenderHeaderBannerOptions): string {
    const mainContent = input.mainContent ?? {};
    const assets = input.assets ?? {};
    const siteSearch = assets.siteSearch;
    const brandLink = mainContent.url;
    const mainUrl = brandLink ? squizLinkHref(brandLink, '') : '';
    const brandLinkTarget = brandLink?.target?.trim();
    const brandLayout = resolveBrandLayout(input);
    const mainClass = resolveMainPaletteClass(brandLayout, mainContent.palette);
    const showSearch = shouldShowSiteSearch(siteSearch);
    const searchResultsUrl = resolveSearchResultsUrl(siteSearch);
    const autosuggestUrl = resolveHeaderAutosuggestUrl(siteSearch, info);

    const brandHtml = brandLayout
        ? renderHeaderBrand({
              input,
              mainContent,
              url: mainUrl,
              linkTarget: brandLinkTarget,
              brandLayout,
              editMode,
          })
        : '';

    return html`
    <div class="qld-header-main ${mainClass}">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">${brandHtml}</div>
          ${
              showSearch
                  ? html`
                <div class="col-lg-4">
                  <div
                    id="qld-header-search"
                    class="qld-header-site-search is-closed"
                  >
                    <form
                      class="site-search"
                      role="search"
                      action="${xssSafeContent(searchResultsUrl)}"
                      ${editorSqField(editMode, 'assets.siteSearch.searchResultsUrl')}
                    >
                      ${renderHeaderSearchInner({
                          siteSearch: siteSearch ?? {},
                          editMode,
                          autosuggestUrl,
                      })}
                    </form>
                  </div>
                </div>
              `
                  : ''
          }
        </div>
      </div>
    </div>
  `;
}
