> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/sidenav` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Side navigation

QGDS Bootstrap 5 side navigation for the section that holds the current page. It shows the direct parent page as the title, that parent's child pages as the list, and the current page's child pages under it.

## DXP

- **Manifest name:** `sidenav`
- **Namespace:** `qgds-bs5`
- **Version:** `0.1.2`. Bump `manifest.json` `version` on each deploy-worthy change.
- **Entry:** `main.js`

## CMS fields

| Field | Notes |
| ----- | ----- |
| `collapseTitle` | Required. The label on the mobile collapse button. Inline editable. |
| `showChildren` | Default `true`. Shows the current page's child pages under it. |
| `wrapperClasses` | Classes on the `nav`, escaped. |

## Navigation source

Lineage comes from the shared `siteLineage` helpers that the header uses: `fetchSiteLineage` for the lineage (including URL enrichment for derived paths), and `siteLineageToSectionNav` for the section tree. The component set needs `MX_API` and `BEARER_AUTH` to load the whole section. Without them the section is not expanded, so siblings and child pages can be missing.

**Navigable types:** menu-linked children with a resolvable name and URL are listed, including `page`, `page_standard`, `page_content`, `page_redirect`, `folder` and `site` (via `siteLineageToSectionNav`).

Hidden (TYPE_2) links:

- A child whose link into the tree is hidden is not listed, and its children are not searched. The rule below is the exception.
- A folder whose child links are all hidden is not listed. Its pages move up into its place, so page one → folder → page two shows page two under page one. Pages are not dropped by this rule.
- A folder with at least one menu-linked child is listed, with only its menu-linked children. Hidden children stay out.

Untyped links:

- The sidenav opts in to `untypedLinksVisible: true`, so a child whose link has no type is shown. Header nav and breadcrumbs keep the shared menu policy and hide untyped links. This is intentional: the sidenav and the header differ here on purpose.

**Structure**

- **Title:** the direct parent page, linked.
- **List:** the parent's child pages. The current page is marked `aria-current="page"`.
- **Expanded:** the current page's child pages, when `showChildren` is on.
- **Top-level page:** a page directly under the site has no parent in its section. It is the title, and its child pages are the list.

**Empty output.** Live output is `""` when the current page is not in the section, or when the lineage request fails. Edit mode keeps the markup so the editor can still set `collapseTitle`.

**No page asset.** Storybook and the editor preview have no page asset. They use the fixture in [`preview-navigation.json`](preview-navigation.json). Live output with no page asset is empty.

## Edit mode

`data-sq-field="collapseTitle"` is written only when `componentUtilities.ctx.editor` is true.

## Markup parity

Compared with [`sidenav.hbs`](sidenav.hbs):

- Edge renders two levels. The current page's children are shown, but not their children. `sidenav.hbs` renders three.
- Edge marks the current page with `aria-current="page"`. `sidenav.hbs` does not.
- Edge returns `""` when there is nothing to navigate. `sidenav.hbs` renders the wrapper.
- Edge escapes the `wrapperClasses`, link URLs and page names.

The `qld-side-navigation`, `nav-wrapper`, `nav-title`, `nav-item` and `nav-link` class names match `sidenav.hbs`.

## Styles and scripts

- SCSS: `sidenav.scss` is registered in [`src/css/main.scss`](../../../css/main.scss) and [`src/css/main.qcot.scss`](../../../css/main.qcot.scss).
- JS: none. The mobile collapse uses the Bootstrap collapse in the bundle.
- `sidenav.hbs` stays registered as a Handlebars partial in `src/js/handlebars.partials.js`, for legacy pages.
- `Sidenav.js` (the Handlebars class wrapper) was removed. Nothing imported it.

## Tests

- **File:** `sidenav/sidenav.test.js`
- **Covers:** the parent title, sibling list and active page, the top-level page case, `showChildren`, lineage arguments, empty output in live and edit modes, edit-mode `data-sq-field`, the preview fixture, and escaping of `wrapperClasses`, link URLs and page names.
- **Run:** `npm run test:run -- src/components/bs5/sidenav`

No test calls a live Matrix service. `fetchSiteLineage` is mocked. The tree builder runs for real.

## Preview

- DXP: `npm run dev:dxp`, `default` preview (`preview.data.json`)
- Storybook: `npm run storybook`, `2. Layout/Side navigation`

## Known gaps

1. **Two levels only.** The tree builder already produces every level. Adding a third level is a small change, but it changes what editors see on deployed pages, so it needs a decision.
2. **Request count.** The section tree is expanded up to five levels deep. A large section can mean many Content API requests. Check the timing in `npm run dev:dxp` before deploying.
3. **Escape helpers are local.** `escapeAttribute` and `editorSqField` are copied from the banner. Move them to a shared helper with the other copies once the Card branch is merged.
