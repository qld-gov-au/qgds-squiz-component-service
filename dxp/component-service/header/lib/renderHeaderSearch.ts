import {html} from '../../../utils/html.js';
import {xssSafeContent} from '../../../utils/xss.js';
import {Button} from '../../../utils/searchInput/Button.js';
import {Input} from '../../../utils/searchInput/Input.js';
import {Suggestions} from '../../../utils/searchInput/Suggestions.js';
import {editorSqField} from './editorSqField';
import type {HeaderSiteSearch} from './types';

function funnelbackDataAttributes(settings: Record<string, string | undefined>): string {
    return Object.entries(settings)
        .reduce((acc, [key, value]) => {
            if (key && value) {
                acc.push(`data-${key}="${xssSafeContent(value)}"`);
            }
            return acc;
        }, [] as string[])
        .join(' ');
}

export interface RenderHeaderSearchInnerOptions {
    siteSearch: HeaderSiteSearch;
    editMode?: boolean;
    autosuggestUrl: string;
}

/** Inner search field markup for the header site-search form (no nested form). */
export function renderHeaderSearchInner({siteSearch, editMode, autosuggestUrl}: RenderHeaderSearchInnerOptions): string {
    const ariaLabel = siteSearch.label?.trim() || 'Search website';
    const placeholder = siteSearch.placeholder?.trim() || '';
    const collection = siteSearch.collection?.trim() || '';
    const profile = siteSearch.profile?.trim() || '';
    const numranks = siteSearch.numRanks?.trim() || '10';
    const tiers = siteSearch.tiers?.trim() || 'off';

    const hasDynamicSuggestions = Boolean(collection && autosuggestUrl);

    const funnelbackAttrs = hasDynamicSuggestions
        ? funnelbackDataAttributes({
              suggestions: autosuggestUrl,
              collection,
              profile,
              numranks,
              tiers,
          })
        : '';

    const inputEditAttrs = [
        editorSqField(editMode, 'assets.siteSearch.label'),
        editorSqField(editMode, 'assets.siteSearch.placeholder'),
        editorSqField(editMode, 'assets.siteSearch.autosuggestUrl'),
        editorSqField(editMode, 'assets.siteSearch.collection'),
        editorSqField(editMode, 'assets.siteSearch.profile'),
        editorSqField(editMode, 'assets.siteSearch.numRanks'),
        editorSqField(editMode, 'assets.siteSearch.tiers'),
        funnelbackAttrs,
    ]
        .filter(Boolean)
        .join(' ');

    return html`
    <div class="qld-search-input full-width">
      ${Input({
          id: 'search',
          name: 'query',
          ariaLabel,
          placeholder,
          extraAttributes: inputEditAttrs,
      })}
      ${Button({
          label: 'Search',
          id: 'search-button',
          type: 'submit',
      })}
      ${
          hasDynamicSuggestions
              ? Suggestions({
                    hasDynamicSuggestions: true,
                    hasManualSuggestions: false,
                    manual: undefined,
                    dynamic: {
                        fbSettings: {
                            collection,
                            profile,
                            suggestions: autosuggestUrl,
                            numranks,
                            tiers,
                        },
                    },
                })
              : ''
      }
    </div>
  `;
}

export function isSiteSearchEnabled(siteSearch?: HeaderSiteSearch): boolean {
    return siteSearch?.enabled === 'show';
}

export function resolveSearchResultsUrl(siteSearch?: HeaderSiteSearch): string {
    return siteSearch?.searchResultsUrl?.trim() || '';
}

export function shouldShowSiteSearch(siteSearch?: HeaderSiteSearch): boolean {
    return isSiteSearchEnabled(siteSearch) && Boolean(resolveSearchResultsUrl(siteSearch));
}
