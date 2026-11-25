> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/banner` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Banner

QGDS Bootstrap 5 banner for the top of a page: title, optional breadcrumbs, optional subtitle and abstract, optional call to action (buttons or cards) and an optional hero image.

## DXP

- **Manifest name:** `banner`
- **Namespace:** `qgds-bs5`
- **Version:** `0.1.0`. Bump `manifest.json` `version` on each deploy-worthy change.
- **Entry:** `main.js`. The component stays on JavaScript for now.

## CMS fields

| Field | Notes |
| ----- | ----- |
| `textContent.title` | Required for live output. Inline editable. Filtered with `xssSafeContent`. |
| `textContent.subtitle`, `textContent.abstract` | Inline editable. Left out of live output when empty. |
| `textContent.blockTitle` | Adds `as-block` to the title. |
| `generalSettings.wrapperClasses`, `bannerType`, `variantClass` | Classes on the outer `div`, escaped. |
| `generalSettings.showBreadcrumbs` | Shows the trail from the site root to the page the banner is placed on, from the Matrix site lineage (see below). |
| `backgroundType` | The hero image only renders for `with-hero-image`. |
| `bannerImageField.squizImageField` | SquizImage only. Inline editable. The URL must be `http(s)`, `mailto`, `tel` or relative. The alt text is escaped. |
| `imageClasses` | Classes on the image wrapper, escaped. |
| `callToAction` | `none`, `buttons`, `cards` or `cards-mixed`. |
| `ctaItems[].link` | SquizLink. Matrix asset picker links are resolved with `resolveSquizLink` before render. |
| `ctaItems[].variantClass` | `btn-primary` or `btn-secondary`. Used for buttons only. |

**Removed: custom image URL.** The `imageSource` selector and its `customUrl` option (a `src` string field) are gone. The image is SquizImage only. The `bannerImageField.squizImageField` data path is unchanged, so existing SquizImage content still renders. Content saved with `customUrl` renders with no image, so migrate those banners to a SquizImage before deploying this version.

**Empty output.** Live output is `""` when `textContent.title` is empty. In edit mode the markup is kept so the editor can type into it.

**CTA items.** In live mode, an item is dropped when its link has no safe URL, so the banner never renders `href="#"` or a `javascript:` link. In edit mode, items without a URL are kept with a placeholder `href="#"` so the editor can fix them. Each item keeps its manifest index, so the `data-sq-field` paths and the mixed card colours stay correct when another item is dropped.

**Breadcrumbs.** The trail comes from the Matrix site lineage through `resolveBreadcrumbs` in `utils/matrix/siteLineage/`. This is the same data source as the standalone breadcrumbs component, so the two show the same trail. The current page is the last item and is shown as text.

- **Live page with a placement** (`ctx.assetId` or `ctx.url`): the trail comes from site lineage. No trail means no `.banner-breadcrumbs` wrapper.
- **Live page with no placement:** no trail and no lookup.
- **Editor, local dev (`IS_LOCAL`, `npm run dev:dxp`) or Storybook (no utilities):** the preview trail from `siteLineage/fixtures/preview-breadcrumbs.json`. The `preview.data.json` default turns breadcrumbs on, so the dev preview shows them.
- **Environment:** the Matrix keys listed in `manifest.json` `environment`. `BASE_PATH` is read by the lineage path, so it stays.
- **Hidden (TYPE_2) links:** an ancestor is dropped when the link into it is hidden. A folder is also dropped when its link to the next trail item is hidden, so page → folder → page shows only the two pages. Pages are never dropped by the outgoing-link rule, and the current page is always shown.
- **Escaping:** titles are escaped as text. URLs must pass `safeUrl`. A breadcrumb with an unsafe URL renders as plain text.
- **Logging:** the shared lineage logging is off by default. `SITE_LINEAGE_DEBUG=true` turns it on for `npm run dev:dxp`. Warnings and errors are still logged.

The Handlebars `banner.hbs` renders the breadcrumb wrapper only when `breadcrumbs` has items. The page layouts (`contentPageWithSideNavigation.hbs`, `contentPageWithForm.hbs`) hide their own breadcrumbs when `banner.breadcrumbs` is set, so the trail is not shown twice.

## Edit mode

`data-sq-field` attributes are written only when `componentUtilities.ctx.editor` is true. Live output has none. In edit mode the subtitle, abstract, CTA text and URL, and image targets are rendered even when empty.

## Markup parity

Compared with [`banner.hbs`](banner.hbs):

- Edge returns `""` when the title is empty. `banner.hbs` renders the banner and leaves out only the `h1`.
- Edge escapes every attribute value. Text goes through `xssSafeContent`.
- Edge drops CTA items with no safe URL in live mode.
- Edge hides the decorative card arrow icon from assistive technology (`aria-hidden="true"`).
- The image wrapper has `role="img"` and `aria-label` only when there is alt text. Otherwise it is `aria-hidden="true"`.

Class names and the overall `qld-banner` / `banner-inner` / `banner-content` structure match `banner.hbs`.

## Styles and scripts

- SCSS: `banner.scss` is registered in [`src/css/main.scss`](../../../css/main.scss) and [`src/css/main.qcot.scss`](../../../css/main.qcot.scss).
- JS: the banner registers none. `initBreadcrumb()` in `breadcrumbs/breadcrumbs.functions.js` is registered in `src/js/qld.bootstrap.js`. It collapses the first `.breadcrumb` on the page, so a banner trail with more than five items collapses like the standalone component.
- `banner.hbs` is still registered as a Handlebars partial in `src/js/handlebars.partials.js`, for legacy parity.
- `Banner.js` (the Handlebars class wrapper) was removed. Nothing imported it.

## Tests

- **File:** `banner/banner.test.js`
- **Covers:** preview data render, empty output in live and edit modes, edit-mode targets, the `ctaItems` crash, CTA href and aria-label escaping, unsafe CTA URLs, items with no URL, Matrix asset picker resolution (stubbed `info.fns`), mixed card colours after a dropped item, breadcrumbs from site lineage (stubbed `fetch`) with title escaping, script-URL handling, empty and failed lineage, the live placement gate, and the editor and local dev preview trail, wrapper class escaping, and hero image URL, alt text and edit placeholder.
- **Run:** `npm run test:run -- src/components/bs5/banner`

No test calls a live Matrix service. Lineage and asset lookups are stubbed.

## Preview

- DXP: `npm run dev:dxp`, `default` preview (`preview.data.json`)
- Storybook: `npm run storybook`, `3. Components/Banners`

## Known gaps

1. **Storybook CTA stories are out of date.** The decorator sets `args.buttons`, `args.cards` and `cardsMixed`. `main.js` reads `ctaItems` and `cards-mixed`, so the CTA stories show no CTAs. Update the stories to the `ctaItems` shape.
2. **Escape helpers are local.** `escapeAttribute`, `safeUrl`, `safeTarget` and `cssUrl` are copied from the Card helpers in `shared/Card/helpers/attributes.js`. Move them to a shared helper once the Card branch is merged.
3. **`isLocalDevRuntime` is imported from the header.** `main.js` imports it from `header/lib/localDevRuntime.js`, so the banner depends on the header folder. Move it to shared utils in a separate change.
4. **Legacy `getLineage` has no callers.** The banner was its only user. It is still in `utils/matrix.js`. Remove it in a separate change.

## Related docs

- [docs/CODING_STANDARDS.md](../../../../docs/CODING_STANDARDS.md)
- [docs/MIGRATION_HBS_TO_DXP.md](../../../../docs/MIGRATION_HBS_TO_DXP.md)
- Design reference: [Queensland Health QGDS](https://www.design-system.health.qld.gov.au/)
