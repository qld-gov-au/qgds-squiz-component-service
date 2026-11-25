> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/cards-listing` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Cards Listing

A list of cards for the child pages of a page, under an optional heading. The default is the page the component is placed on. It can also be a chosen root node. For example, the "Explore the design system" section on the [Queensland Government Design System](https://www.design-system.health.qld.gov.au/) homepage.

Cards are generated from the page tree. Authors do not add or order cards by hand. Cards for hidden or archived pages, and for pages that are not navigable, are left out.

## DXP

- **Manifest name:** `cards-listing`
- **Namespace:** `qgds-bs5`
- **Version:** `0.2.2`. Bump `manifest.json` `version` on each deploy-worthy change.
- **Entry:** `main.ts`

## CMS fields

- `intro` (optional): `headingTag` (h2 to h6, otherwise h2) and `title` (inline editable). With no title, the heading is left out in live mode. In edit mode its target stays in the markup so an author can add one.
- `listing`:
  - `source`: `current` (default) lists the child pages of the page the component is on. `custom` lists the child pages of `rootNode`.
  - `rootNode` (only when `source` is `custom`): a Matrix asset chosen in the resource browser. It is stored as `matrix-asset://<identifier>/<assetId>` and the asset id is read from it. No Matrix call is needed to resolve it.
- `settings`:
  - `columns`: `1`, `2` or `3` cards per row on medium and larger screens. Small screens always show one card per row. Default `2`.
  - `variant`: the colour variant. Default `default`.
  - `display`:
    - `name` (default): the page name, with an arrow. Uses `card card-default default card-single-action card-arrow`.
    - `name-and-description`: the page name and a description. Uses `card card-default default card-single-action`, with no arrow.
  - `descriptionMetadataFieldKey` (only with `display` = `name-and-description`): the metadata key on each child page that holds the description, for example `page-lead`.
  - `isEqualHeight` (default on): cards in a row share a height.

## Which children are listed

Only direct children of the root node, in the order the Content API returns them:

- the link is not hidden from menus (`link_type` `hidden` or `2` is skipped, the same rule as the header navigation),
- the asset type is navigable (`page`, `page_standard`, `page_content`, `page_redirect`, `folder` or `site`),
- the status is not `archived`, `trashed` or `deleted`,
- the asset has a name and a URL.

The child list is capped at 100 by the lineage request (`limit=100`).

## Markup

- Output is a `<div class="card-listing">`, then the optional heading (`<h2 class="mb-4">` by default), then `<ul class="row row-cols-… g-4 list-unstyled">`.
- Each card is an `<li>` containing a card rendered by `lib/renderListingCard.ts`.
- With equal height on, each `<li>` is `d-flex` and each card is `h-100`.
- The link is a single `<a class="stretched-link">` over the title, so the whole card is clickable.
- Output is `""` when there are no listed children, and no heading is shown either.
- Generated cards have no `data-sq-field` targets. Only the intro heading is editable.

The card markup is built locally, not through the shared Card helpers in [`src/components/shared/Card/`](../../shared/Card/). The shared helper does not produce the `card-arrow` markup (arrow inside the title, no arrow class on the card). Cards (Advanced) keeps the shared helper and its markup.

## Links, URLs and escaping

- Child URLs come from the lineage asset (`resolveAssetNavigationUrl`). An unsafe URL is not written as an `href`. The title is still shown as text.
- The title and description are escaped with `xssSafeContent`. Attribute values are escaped with `escapeAttribute`.
- A failed child lookup, or a failed description request, returns no cards or no description. It never fails the render.

## Data and lookup

- `lib/resolveListingRootId.ts`: picks the root id from `listing`. `current` uses `ctx.assetId`. `custom` parses the id from `rootNode`. An invalid value returns `""`.
- `lib/resolveChildCards.ts`: loads the root's children (`fetchSectionChildrenTree`, `maxDepth: 1`), enriches the URLs, and filters with the menu and navigable rules above. For `name-and-description` it also reads one metadata bag per child (`?data=metadata`) and takes the value from `descriptionMetadataFieldKey`. A failed metadata request leaves that card without a description.
- Requests go through the AMAPI proxy in `dev:dxp` (`resolveLineageContentApiFetchImpl`). Edge uses `MX_API` and `BEARER_AUTH`.
- Tests stub `fetchImpl` with inline payloads. No test calls Matrix.

## Known gaps and decisions

1. **Manual `cards` removed, no compatibility shim.** Version `0.2.0` drops the manual `cards[]` list, `settings.action` and `settings.isArrowVisible`. A page that still stores those values will now show the generated list instead. Deployment of this component is not confirmed, so this was handled with a version bump only. If it is in use on live pages, ask before adding back a fallback.
2. **Arrow follows the display option.** The arrow is shown only in `name` mode. There is no separate arrow toggle.
3. **Empty description omits the description block.** In `name-and-description` mode a card with an empty description shows the title only (no `card-text` element).
4. **One metadata request per child.** Description mode adds one Content API request for each listed child, so it is more expensive on large sections.
5. **No featured cards.** A featured card uses a full-width layout, which does not fit one cell in a list. It is not part of this component.
6. **Shared Card helper not used.** If the shared Card helper is changed to the `card-arrow` markup, this component keeps its own renderer. Check both when the arrow markup changes.
7. **`matrix-asset-uri` in `dev:dxp` is untested.** The resource browser value is parsed from the URI. Confirm it resolves in the DXP dev server before relying on `custom`.
8. **Visual parity with the design system site.** The live example uses the `qld__card` and `qld__card-list` classes. This repo's cards use the QGDS Bootstrap 5 classes (`card`, `card-title`, `row`), so the listing follows those. The example's background colour wrapper is not reproduced.

## Styles and scripts

- SCSS: [`card-listing.scss`](card-listing.scss), registered after the card styles in [`src/css/main.scss`](../../../css/main.scss) and [`src/css/main.qcot.scss`](../../../css/main.qcot.scss). It removes the card shadow (at rest, on hover and on focus) inside the `.card-listing` wrapper only. Cards (Advanced) and Cards (Simple) keep their shadows.
- The layout uses Bootstrap classes (`row`, `row-cols-*`, `g-4`, `list-unstyled`, `d-flex`, `h-100`, `mb-4`). The card styles are in [`card.scss`](../card/card.scss).
- JS: none.

## Tests

- **Files:** `card-listing.test.ts`, `lib/resolveChildCards.test.ts`, `lib/resolveListingRootId.test.ts`
- **Covers:**
  - `card-listing.test.ts`: empty output, list markup, column classes, equal height, both display modes (exact markup, arrow only in name mode, `card-text` omitted when empty), the stretched link, the intro heading (tag, fallback and escaping), escaping of titles, descriptions and unsafe URLs, edit-mode targets, the lookup inputs, and the preview data and manifest (only declared fields, no `action`, `isArrowVisible` or `cards`).
  - `lib/resolveChildCards.test.ts`: menu-visible, navigable children in API order; hidden, image and archived pages excluded; direct children only (`depth=1`); root fetched when missing; empty on failed requests; metadata only in description mode; description from the configured key; a failed metadata request keeps the card.
  - `lib/resolveListingRootId.test.ts`: `current` uses `ctx.assetId`; `custom` parses the id; invalid root nodes return `""`.
- **Run:** `npm run test:run -- src/components/bs5/card-listing`

## Preview

- DXP: `npm run dev:dxp`, `default` preview (`preview.data.json`: `listing.source` `current`, `settings.display` `name`). The preview lists the children of `ctx.assetId`. Check the dev server supplies an asset id, otherwise the list is empty.
- The DXP preview loads the published `qld.bootstrap.css` (see `preview.html`), not the local SCSS. Changes to `card-listing.scss` show in the preview only after that stylesheet is rebuilt and published.
- Storybook: none
