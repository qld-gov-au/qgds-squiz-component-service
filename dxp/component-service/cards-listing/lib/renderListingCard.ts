import {xssSafeContent} from '../../../utils/xss.js';
import {escapeAttribute, safeUrl} from '../../../utils/Card/helpers/attributes.js';
import type {NavigationCardItem} from '../../../utils/matrix/siteLineage/types.js';
import type {CardListingDisplay} from '../types.js';

export interface RenderListingCardOptions {
    display: CardListingDisplay;
    variant: string;
    isEqualHeight: boolean;
}

/**
 * One generated child page card.
 *
 * `name`: page name with the arrow icon (`card-arrow`).
 * `name-and-description`: page name and a `card-text` block, no arrow.
 * The stretched link and `card-single-action` are always on.
 */
export function renderListingCard(item: NavigationCardItem, options: RenderListingCardOptions): string {
    const withDescription = options.display === 'name-and-description';
    const href = escapeAttribute(safeUrl(item.url));
    const title = xssSafeContent(item.title ?? '');
    const description = (item.description ?? '').trim();

    const classes = ['card', `card-${options.variant} ${options.variant}`, 'card-single-action', withDescription ? '' : 'card-arrow', options.isEqualHeight ? 'h-100' : '']
        .filter(Boolean)
        .join(' ');

    const link = href ? `<a href="${href}" class="stretched-link">${title}</a>` : title;

    const textBlock =
        withDescription && description
            ? `
          <div class="card-text">${xssSafeContent(description)}</div>`
            : '';

    const arrow = withDescription
        ? ''
        : `
          <div class="qld-icon qld-icon-md qld-icon-arrow-right"></div>`;

    return `<div class="col">
      <div class="${classes}">
        <div class="card-body">
          <h3 class="card-title">${link}</h3>${textBlock}${arrow}
        </div>
      </div>
    </div>`;
}
