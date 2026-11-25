> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/footer` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Footer (DXP)

Queensland Government site footer for QGDS Bootstrap 5. DXP Edge delivery uses TypeScript (`main.ts`). Markup follows `footer.hbs` except where the QGDS spec differs (see [Markup parity](#markup-parity)). Phases 1 and 2 of [docs/plans/footer-dxp](../../../../docs/plans/footer-dxp/README.md) are complete. Phase 3 code is complete. The deploy and the Matrix editor checks are manual. The four variants (`default`, `defaultBlank`, `dark`, `darkAlt`) render through the DXP dev UI.

The editor fields were reduced after the Phase 2 review. See [Editor fields](#editor-fields) and [editor-fields-notes.md](../../../../docs/plans/footer-dxp/editor-fields-notes.md).

## Folder layout

| Path | Contents |
| ---- | -------- |
| Root | `main.ts`, `manifest.json`, `types.ts`, `preview.html`, `footer.test.ts`, `footer.preview.test.ts`, Storybook (`Footer.js`, `footer.stories.js`, `Footer.mdx`) |
| [`lib/`](lib/) | `renderFooter.ts` (markup), `defaults.ts` (fallback content), `resolveFooterSquizLinks.ts` (Matrix asset links), `resolveFooterSquizLinks.test.ts` |
| [`preview-data/`](preview-data/) | **Dev/test only.** DXP preview fixtures (`preview.data.default.json`, `.blank.json`, `.dark.json`, `.darkAlt.json`). Referenced from `manifest.json`; not imported by `main.ts`. |
| `*.hbs`, `*.data.json` | Storybook and legacy reference. Not used by Edge `main`. Still use the previous data shape. |
| `footer.scss` | Styles, imported from `src/css/main.scss`. |

## DXP

- **Manifest name:** `footer`
- **Display name:** Footer
- **Namespace:** `qgds-bs5`
- **Type / entry:** `edge` / `main.ts`
- **Version:** `0.1.0`, prepared for the first deploy. Bump `manifest.json` `version` for each deploy.
- **Deployed:** not yet recorded. After `dxp-next cmp deploy`, add the version and date here.
- **Previews:** `default`, `defaultBlank`, `dark`, `darkAlt`. Each uses `preview.html` as the wrapper.
- **Environment:** `BASE_DOMAIN`, `BASE_URL`, `MX_API`, `BEARER_AUTH`, `AMAPI_TOKEN`, `AMAPI_CACHE_TTL_WEEKS`. All optional (`required: false`). See [Content API and environment](#content-api-and-environment).

## Editor fields

The manifest has 25 editor fields in 9 top-level inputs. Four are inline-editable (`sitename`, `contact.content`, `contact.button`, `copyright.content`). `variant` is a quick option.

| Input | Fields | Notes |
| ----- | ------ | ----- |
| `variant` | 1 | Quick option. `default` adds no modifier class. |
| `sitename` | 1 | Shown above the columns. Empty hides the row. Inline editable. Required by the spec. |
| `contact` | title, content, button, showList, list | `content` and `button` are inline editable. Empty values use the defaults. |
| `footerLinks` | list | Government links. Empty uses the spec defaults. The list order is the spec order. Divider is fixed. |
| `optionalColumn1`, `optionalColumn2` | title, content, followLinks, customLinks | Each column owns its social and custom links. The column shows when it has content or links. Divider is fixed. |
| `acknowledgement` | 1 | FormattedText. Empty uses the default paragraph. The heading is always "Acknowledgement of Country". |
| `footerLogo` | show | Shows the Coat of Arms. |
| `copyright` | content, yearFrom | `content` is inline editable. Add the department name here (ForGov checkpoint 34). `yearFrom` enables the start-year range. |

**Removed in the review:** the organisation link (always shown, not editable), the four divider toggles (fixed), `footerLinks.title`, `copyright.showYearFrom` (a start year enables the range), the custom logo image (not in the spec), the separate top-level social and custom link lists (now in each column), `showFollowLinks` and `showCustomLinks` (a column shows its links when they are set), and the repeatable acknowledgement list with its editable heading (now one text field under a fixed heading).

All nested objects have `"required": []`.

## Markup parity

Compared with `footer.hbs`:

- **Same structure and classes:** `<footer class="qld-footer">` (plus `dark` or `dark-alt` where selected), `.container`, sitename row, contact column, government links, optional columns 1 and 2, legal `col crest` column, acknowledgement, Coat of Arms, copyright and organisation link.
- **Deliberate change: government links are a `nav`.** `<nav class="col-12 col-lg-2 border-column" aria-label="Footer navigation">` replaces `footer.hbs`'s `<div aria-label="footer-navigation">`. A `div` with `aria-label` is not reliably announced.
- **Deliberate change: optional column links are a `nav`.** `optional-column-1` and `optional-column-2` are `div`s with the same classes as `footer.hbs`. A `nav` labelled with the column title (or "Footer links") wraps only the social and custom link lists. The heading and text content sit outside it. A column with no links has no `nav`. See [phase-3-notes.md](../../../../docs/plans/footer-dxp/phase-3-notes.md) and [phase-2-notes.md](../../../../docs/plans/footer-dxp/phase-2-notes.md).
- **Deliberate change: fixed dividers.** The government links and both optional columns have a divider (`border-column`), as in the Storybook default. The contact column has none. The spec doesn't define per-column dividers, so there are no editor toggles. A blank footer therefore shows the government-links divider. `footer.hbs` shows it only when the author enables it.
- **Deliberate change: default government links follow the QGDS spec.** `lib/defaults.ts` lists items 1–7 of the spec in order: Copyright, Disclaimer, Privacy, Right to information, Accessibility, Jobs in Queensland Government, Other languages. Help is removed, because the spec does not list it. `footer.hbs` still includes Help.
- **Deliberate change: fixed organisation link.** "Queensland Government" to `https://www.qld.gov.au` is always rendered as the last legal link. The spec requires it. `footer.hbs` shows it only when `show` is set, with an editable URL.
- **Deliberate change: fixed acknowledgement heading.** The spec includes a header on the Acknowledgement of Country, so the heading is always "Acknowledgement of Country". `footer.hbs` shows no heading when the acknowledgement is empty.
- **Crown copyright is not a link.** The spec lists it, but ForGov checkpoint 34 defines it as the copyright statement. The copyright line (`p.copyright`) carries the statement. The default text is "© The State of Queensland" with the current year. Authors add the department name and the start year. Checkpoint 34 requires the `yyyy–yyyy` range, so a site with no start year shows the current year only and does not meet it. See [phase-2-notes.md](../../../../docs/plans/footer-dxp/phase-2-notes.md).
- **Deliberate change: copyright range format.** A start year renders as `2003–2026`, with an en dash and no spaces, as ForGov checkpoint 34 specifies. `footer.hbs` renders `2003 - 2026`. See [phase-3-notes.md](../../../../docs/plans/footer-dxp/phase-3-notes.md).
- **Other defaults:** `lib/defaults.ts` copies the remaining `footer.hbs` fallbacks: copyright text, contact details and the acknowledgement paragraph.
- **Coat of Arms:** rendered by the shared `renderCoaLogo` helper in [`src/components/shared/logo/`](../../shared/logo/). The header uses the same helper and SVG strings. The custom logo image was removed, because the spec only defines the Coat of Arms.
- **Editor mode:** `data-sq-field` is added only when `info.ctx.editor` is truthy. It appears on `sitename`, `contact.content`, `contact.button` and `copyright.content`.
- **Escaping:** author HTML (`FormattedText`) goes through `xssSafeContent`. Attributes and hrefs go through the shared helpers in [`src/components/utils/attributes.ts`](../../utils/attributes.ts) (escaping, safe hrefs, `data-sq-field`). `javascript:`, `vbscript:` and `data:` URLs are blocked. All HTML is built with the `html` tagged template (`src/components/utils/html.js`).

## Content API and environment

**Matrix asset links.** Any `SquizLink` with a `matrixAssetId` is resolved in `main.ts` before render. `lib/resolveFooterSquizLinks.ts` calls the shared `resolveOptionalSquizLink` ([`src/components/utils/squizLink.ts`](../../utils/squizLink.ts)). This covers `contact.button`, `footerLinks.list[]`, and `optionalColumn1` and `optionalColumn2` (`followLinks[].link` and `customLinks[]`). The organisation link is fixed and not resolved. Links with a manual `url` are not resolved. Author-entered `text` is kept.

After resolution, the render rules are:

- **Contact button.** With no URL, the button keeps the default `qld.gov.au/contact-us` link and uses the asset name as its label.
- **Government and custom links.** A link renders only with a safe URL and a label. Otherwise it is dropped, so no dead or empty anchor is rendered. If no government link is left, the defaults show.
- **Social links.** A link renders only with a safe URL. Otherwise it is dropped.

**Local dev.** The dev render runtime's `resolveMatrixAssetById` mock returns a name and no URL. So a pick under `npm run dev:dxp` shows the mock name on the contact button and drops from the link lists. To read real URLs locally, set `IS_LOCAL`, a Matrix origin in `BASE_DOMAIN`, and a token (`AMAPI_TOKEN`, `VITE_AMAPI_TOKEN` or `ASSET_MANAGEMENT_BEARER_TOKEN`) in the repo `.env`. `resolveSquizLink` then reads the asset through the Content API, the same path the header lineage uses. If that read fails, the link has no URL and the mock is not used. See [`squizlink-notes.md`](../../../../docs/plans/footer-dxp/squizlink-notes.md).

Tests use a mocked resolver and make no network calls.

**Site lineage.** The footer does not use site lineage (`src/components/utils/matrix/siteLineage/`). Footer links are authored only, by decision. There is no lineage gate. [The Matrix utilities README](../../utils/matrix/README.md) lists the footer as a possible future consumer.

**Environment.** `manifest.json` declares the Content API and AMAPI keys the local resolver reads:

| Key | Why |
| --- | --- |
| `BASE_DOMAIN`, `BASE_URL` | Matrix origin for the AMAPI proxy |
| `MX_API`, `BEARER_AUTH` | Content API base and bearer token |
| `AMAPI_TOKEN` | AMAPI bearer for local `dev:dxp` |
| `AMAPI_CACHE_TTL_WEEKS` | Cache TTL for the local AMAPI proxy |

Values come from the repo `.env` through `scripts/dev-dxp.mjs`. Do not put secrets in the manifest. The keys are a subset of `MANIFEST_MATRIX_ENV_KEYS` in `scripts/dev-dxp.mjs`. Keys the footer does not need are left out: `SITE_ROOT_ASSET_ID`, `IS_LOCAL`, `BASE_PATH`, `API_IDENTIFIER`, `AMAPI_DISK_CACHE` and the Funnelback keys (header search and lineage only).

## Runtime and CDN

The footer follows the model where sites load QGDS Bootstrap 5 from the public CDN and do not depend on a gitbridge for front-end assets.

- **HTML:** Edge `main.ts` returns the markup. Matrix renders it. No runtime asset is pulled from a gitbridge.
- **CSS:** `footer.scss` is in the global bundle. Every class selector that `footer.scss` compiles to was found, as an exact match, in the CDN `qld.bootstrap.css` (`https://static.qgov.net.au/qgds-bootstrap5/v2/v2.x.x-latest/assets/css/qld.bootstrap.css`). This was checked during the Phase 1 review. The nested `.footer` parent in the SCSS compiles away and has no rule of its own. Sites that load the CDN get the `qld-footer`, `dark` and `dark-alt` styles without a theme deploy.
- **Unstyled hook classes:** `footer-acknowledgements`, `footer-logo`, `footer-link-list--custom` and `copyright` have no styles in `footer.scss` or the CDN CSS. `footer.hbs` uses the same classes, so this matches the reference.
- **JS:** none. The footer has no client behaviour. `footer.functions.js` is not registered in `src/js/qld.bootstrap.js`, because its only import is the commented-out Formio feedback form, which is excluded from the footer.
- **Preview styling:** `preview.html` loads the published QGDS CSS and JS from the CDN, the same pattern as the header. Local SCSS edits won't show in previews until they're published. Check visual changes in Storybook (`2. Layout/Footer`).

## Styles and scripts

- **SCSS:** `footer.scss` is imported from `src/css/main.scss` (line 130). It supplies the `dark` and `dark-alt` palettes.
- **JS:** see [Runtime and CDN](#runtime-and-cdn).

## Accessibility check

Contrast was measured against WCAG AA for each variant: 4.5:1 for text and 3:1 for UI components. The method uses the compiled theme, not hand-picked values. Ratios are recorded in [phase-2-notes.md](../../../../docs/plans/footer-dxp/phase-2-notes.md).

| Variant | Element | Ratio | Result |
| ------- | ------- | ----: | ------ |
| default | Body text, headings, links | 6.38–18.67 | Pass |
| default | Contact button text and border | 4.09 | **Text fails 4.5:1.** Border passes 3:1. |
| dark | Body text, links, social icons | 6.38 | Pass |
| dark | Contact button text and border | 3.87 | **Text fails 4.5:1.** Border passes 3:1. |
| dark-alt | All checked elements | 8.92–14.71 | Pass |

The contact button text colour comes from the shared CSS. The component does not override it. The upstream issue draft is in [phase-2-notes.md](../../../../docs/plans/footer-dxp/phase-2-notes.md).

## Tests

- **Files:** `footer.test.ts` (render behaviour), `footer.preview.test.ts` (manifest and preview wiring), `lib/resolveFooterSquizLinks.test.ts` (Matrix asset link resolution)
- **Covers:** the four variant classes; empty-input defaults; government link order and the `nav` landmark; Help omitted and no Crown copyright link in the defaults; fixed dividers on the government links and optional columns, not contact; author overrides; site name and contact list visibility; contact button `SquizLink`; the link lists of optional columns in a labelled `nav`, and no `nav` for a column with no links; social links only in the column that holds them; custom links per column; empty optional columns hidden; social icons and accessible labels; XSS and attribute escaping; entities in copyright text; copyright start year (set and empty); Coat of Arms on and off; the always-on organisation link; the fixed acknowledgement heading; editor `data-sq-field` attributes; manifest preview keys and fixture paths; render of each preview; Matrix asset resolution for every link position in the columns, author text precedence, unresolvable assets and a missing resolver.
- **Run:** `npm run test:run -- src/components/bs5/footer` (46 tests across `footer.test.ts`, `footer.preview.test.ts` and `lib/resolveFooterSquizLinks.test.ts`). The shared helpers have their own tests: `npm run test:run -- src/components/utils/attributes` (18 tests) and `npm run test:run -- src/components/utils/squizLink` (14 tests).

## Preview

- **DXP:** `npm run dev:dxp`, then select `footer` and each preview. Restart `dev:dxp` after editing the manifest or preview data.
- **Offline check:** the four previews also render from `main.ts` without the dev server, by bundling with esbuild.
- **Storybook:** `npm run storybook` (`2. Layout/Footer`). Storybook uses `footer.hbs` and `footer.data.json`, which still have the previous data shape and the Help link.

## Known gaps

These are open decisions or follow-ups, not blockers.

1. **Crown copyright is a statement, not a link.** Help was removed in Phase 2. Crown copyright is carried by the copyright line. Authors add the department name (`copyright.content`) and start year (`copyright.yearFrom`) for ForGov checkpoint 34. If a link is required, the URL is needed. See [phase-2-notes.md](../../../../docs/plans/footer-dxp/phase-2-notes.md).
2. **Class naming.** The spec uses `qld__footer` and modifiers `--dark` and `--dark-alt`. This component keeps the Bootstrap 5 classes `qld-footer`, `dark` and `dark-alt` from `footer.hbs` and `footer.scss`. Changing them needs an upstream CSS change.
3. **Design check.** The design-system URL returns the general QGDS footer spec, not a Queensland Health variant. Visual parity hasn't been checked in a browser. The Storybook comparison is still a manual step, and it now covers the fixed dividers and the fixed acknowledgement heading.
4. **`rel="noopener"` on contact links.** `footer.hbs` sets `rel="noopener"` on the phone and email links. `xssSafeContent` strips `rel`, so the Edge output omits it. The `tel:` and `mailto:` `href` values are kept. These links have no `target`, so the change has no security effect. Recorded as a parity note only.
5. **`customLinks` target (decided: keep the author's target).** `customLinks.hbs` sets `target="_blank"` whenever a link has a target. Edge honours the `SquizLink` target value, as the government, follow and column links already do. The two differ only when the target is not `_blank`.
6. **Optional column `nav` scope (resolved in Phase 3).** The `nav` wraps only the social and custom link lists. The heading and text content sit outside it. See [phase-3-notes.md](../../../../docs/plans/footer-dxp/phase-3-notes.md).
7. **Contact button text contrast (shared CSS).** The button text fails 4.5:1 on the default and dark footers. Raise upstream. Do not override it locally. See the [Accessibility check](#accessibility-check).
8. **Storybook and `footer.hbs` drift.** Storybook still shows Help, the `div` landmarks, the removed fields and the old data shape. Edge changes do not reach Storybook. Deferred until after the deploy (decision in Phase 3). Sync `footer.hbs` and `footer.data.json` then.
9. **Inline editing of an empty site name.** When `sitename` is empty the row isn't rendered, so there's no element for `data-sq-field="sitename"`. Editors need to enter a value first. The field description in the manifest says so. Kept as optional by decision.
10. **Empty lists fall back to defaults.** An empty government links list shows the spec defaults. An empty contact list shows the default phone and email. Editors can't remove every link on purpose.
11. **Fixed layout not yet visually checked.** The fixed dividers and the fixed acknowledgement heading change the default output. Check them in Storybook and the design system before deploy.
12. **Dev render mock has no asset URLs.** Without AMAPI in `.env`, a Matrix pick under `dev:dxp` shows the mock name and no URL. The contact button then uses the default link, and the link lists drop the pick. Set AMAPI in `.env` to test real URLs (see [Matrix asset links](#content-api-and-environment)).

## Related docs

- [docs/plans/footer-dxp/README.md](../../../../docs/plans/footer-dxp/README.md)
- [phase-1-notes.md](../../../../docs/plans/footer-dxp/phase-1-notes.md), [phase-2-notes.md](../../../../docs/plans/footer-dxp/phase-2-notes.md) and [editor-fields-notes.md](../../../../docs/plans/footer-dxp/editor-fields-notes.md)
- [docs/CODING_STANDARDS.md](../../../../docs/CODING_STANDARDS.md)
- [docs/ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)
- [docs/MIGRATION_HBS_TO_DXP.md](../../../../docs/MIGRATION_HBS_TO_DXP.md)
