> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/breadcrumbs` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Breadcrumbs

Shows the trail from the site root to the page the component is placed on. It is used on Queensland Government pages below the banner or header, wherever a trail is wanted.

## DXP

- **Manifest name:** `breadcrumbs`
- **Namespace:** `qgds-bs5`
- **Version:** `0.1.0`. Bump `manifest.json` `version` on deploy-worthy changes.
- **Entry:** `main.ts`

## CMS fields

- **Wrapper classes** (`wrapperClasses`): extra classes on the `nav`. Optional.

The trail itself is not editable. It is derived from site lineage, so editors place the component and the trail follows the page.

## Data

`main` calls `resolveBreadcrumbs(componentUtilities)` from `src/components/utils/matrix/siteLineage/`.

- **Live page with a placement:** the trail comes from Matrix site lineage. The current page is the last item.
- **Live page with no placement:** returns `""`. The mock trail is never shown on a live page.
- **Editor, Storybook (no utilities), or local dev (`IS_LOCAL`, `npm run dev:dxp`) with no placement:** shows the mock trail from `preview-trail.json`. This is passed to `resolveBreadcrumbs` as `previewItems`, so the fixture in `siteLineage/fixtures/` is not used here.
- **Homepage, not-found page, empty lineage, or Matrix env missing or failing:** returns `""`.
- **Hidden (TYPE_2) links:** an ancestor is dropped when the link into it is hidden. A folder is also dropped when its link to the next trail item is hidden, so page → folder → page shows only the two pages. Pages are never dropped by the outgoing-link rule, and the current page is always shown.

Matrix env keys are declared in `manifest.json` `environment`. `API_HOME_PATHS` sets extra homepage paths. Unit tests use a stubbed `fetch` and `siteLineage/fixtures/site-lineage-page-content.json`. They never call Matrix.

**Logging:** `resolveBreadcrumbs` logs only warnings (preview fallback, missing Matrix env) and errors (failed request). The shared lineage diagnostics (`siteLineageLog.ts`, also used by the header) are off by default. Set `SITE_LINEAGE_DEBUG=true` in the repo `.env` to see them during `npm run dev:dxp`.

## Markup parity

Matches `breadcrumbs.hbs`:

- `nav[aria-label="breadcrumb"] > ol.breadcrumb > li.breadcrumb-item`
- Ancestors are links. The current page is `li.breadcrumb-item.active[aria-current="page"]` as text.

Differences from the Handlebars version:

- Empty output returns `""` instead of an empty `nav`. An empty `.breadcrumb` is picked up first by `initBreadcrumb()`, so it would stop the real trail being initialised.
- `data-href` is not rendered on the current item. No CSS or JS reads it.

## Styles and scripts

- **SCSS:** `breadcrumbs.scss` is registered in `src/css/main.scss`.
- **JS:** `initBreadcrumb()` in `breadcrumbs.functions.js` is registered in `src/js/qld.bootstrap.js`. It adds the collapse control for trails longer than five items (three when they overflow).

## Overlap with the banner

The banner's `showBreadcrumbs` option renders its own trail with the legacy `getLineage` helper. A page with both the banner trail and this component would show two trails. The planned fix is to hide page-level breadcrumbs when the banner renders its own. That change is pending on the banner branch, and it is not part of this component.

## Tests

- **File:** `main.test.ts`
- **Covers:** the trail markup, the current page item, empty output for a live page with no placement or no trail, escaping of names, URLs and wrapper classes, the editor, local dev (`IS_LOCAL`) and Storybook mock trail, and the failed-request path.
- **Also:** `breadcrumbs.test.js` covers the Handlebars markup and the `initBreadcrumb()` behaviour. Keep it passing.
- **Lineage:** `src/components/utils/matrix/siteLineage/resolveBreadcrumbs.spec.ts`
- Run: `npm run test:run` or `npx vitest run src/components/bs5/breadcrumbs src/components/utils/matrix/siteLineage`

## Preview

- **DXP:** `npm run dev:dxp`, then open the breadcrumbs entry in the dev UI. It shows the mock trail from `preview-trail.json`, with the last item as the current page.
- **Mock trail:** edit `preview-trail.json` to change the trail. Each item needs `title` and `url`. The last item is the current page. Add more than five items to check the collapse (`Home › ••• › …`) at desktop width. Titles and URLs are escaped, so you can test awkward characters.
- **Mock URLs are `#` anchors.** Real-looking paths 404 on the dev server when clicked. Keep `#` anchors unless you are testing navigation against a real site.
- **Narrow windows show only the parent link.** Below the `lg` breakpoint (992px) the QGDS styles hide every item except the parent, which shows as a back link. This matches the Handlebars component. Widen the window to 992px or more to see the full trail and the collapse.
- **Wrapper classes:** set `wrapperClasses` in `preview.data.json` to test extra classes on the `nav`. This file holds only that field. The trail is never edited there.
- **Storybook:** `npm run storybook` (`breadcrumbs.stories.js`, HBS markup, not the Edge component).
- Restart `dev:dxp` after changing `manifest.json`.
