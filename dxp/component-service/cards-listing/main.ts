/**
 * Cards Listing component.
 *
 * An optional heading above a list of cards for the child pages of the
 * current page, or of a chosen root node. Each card is a page name, optionally
 * with a description from a metadata field. The card markup is rendered by
 * lib/renderListingCard.ts. It matches the QGDS card pattern and does not use
 * the shared Card helpers.
 */

import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';
import type {DxpComponentCtx} from '../../types/dxp.js';
import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types.js';
import type {CardListingInput, CardListingIntro, ColumnCount, HeadingTag} from './types.js';
import {resolveListingRootId} from './lib/resolveListingRootId.js';
import {resolveChildCards} from './lib/resolveChildCards.js';
import {renderListingCard} from './lib/renderListingCard.js';

const HEADING_TAGS: readonly HeadingTag[] = ['h2', 'h3', 'h4', 'h5', 'h6'];
const DEFAULT_HEADING_TAG: HeadingTag = 'h2';

// Bootstrap row-cols classes. Small screens always show one card per row.
const COLUMN_CLASSES = new Map<string, string>([
    ['1', 'row-cols-1'],
    ['2', 'row-cols-1 row-cols-md-2'],
    ['3', 'row-cols-1 row-cols-md-2 row-cols-lg-3'],
]);
const DEFAULT_COLUMNS: ColumnCount = '2';

function isEditMode(info?: DxpComponentInfo): boolean {
    const ctx = info?.ctx;
    return typeof ctx === 'object' && ctx !== null ? Boolean((ctx as DxpComponentCtx).editor) : false;
}

function headingTagName(value: unknown): HeadingTag {
    return HEADING_TAGS.find((tag) => tag === value) ?? DEFAULT_HEADING_TAG;
}

function columnClasses(value: unknown): string {
    return COLUMN_CLASSES.get(String(value)) ?? COLUMN_CLASSES.get(DEFAULT_COLUMNS) ?? '';
}

function renderIntro(intro: CardListingIntro | undefined, editMode: boolean): string {
    const title = intro?.title ?? '';

    // Keep the heading in edit mode so an editor can add a title.
    if (!title && !editMode) {
        return '';
    }

    const tag = headingTagName(intro?.headingTag);
    const titleEditAttr = editMode ? ` data-sq-field="intro.title"` : '';

    return html`<${tag} class="mb-4"${titleEditAttr}>${xssSafeContent(title)}</${tag}>`;
}

export default {
    async main(input?: CardListingInput | null, componentUtilities?: DxpComponentInfo) {
        const {intro, listing, settings} = input ?? {};

        const rootId = resolveListingRootId(listing, componentUtilities);
        const children = await resolveChildCards(rootId, componentUtilities, {
            display: settings?.display ?? 'name',
            descriptionMetadataFieldKey: settings?.descriptionMetadataFieldKey,
        });

        if (!children.length) {
            return '';
        }

        const editMode = isEditMode(componentUtilities);
        const isEqualHeight = settings?.isEqualHeight ?? true;
        const display = settings?.display ?? 'name';
        const variant = settings?.variant ?? 'default';

        // A flex item stretches to the row height, so cards in a row match when
        // equal height is on. The card's h-100 fills that stretched item.
        const items = children
            .map((child) => {
                const itemClass = isEqualHeight ? ` class="d-flex"` : '';
                return `<li${itemClass}>${renderListingCard(child, {
                    display,
                    variant,
                    isEqualHeight,
                })}</li>`;
            })
            .join('');

        return html`
      <div class="card-listing">
        ${renderIntro(intro, editMode)}
        <ul class="row ${columnClasses(settings?.columns)} g-4 list-unstyled">
          ${items}
        </ul>
      </div>
    `;
    },
};
