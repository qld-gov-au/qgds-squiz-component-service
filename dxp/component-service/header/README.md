> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/header` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Header (DXP)

Site header banner and primary navigation for QGDS Bootstrap 5. DXP Edge delivery uses TypeScript (`main.ts`) with markup parity to `handlebars/header.hbs` and `navbar.hbs`.

## Folder layout

| Path | Contents |
| ---- | -------- |
| Root | `main.ts`, `manifest.json`, `preview.html`, Storybook (`Header.js`, `header.stories.js`, `Header.mdx`), root tests (`header.test.ts`, `header.main.test.ts`) |
| [`lib/`](lib/) | Edge renderers (`renderHeaderBanner.ts`, …), nav resolution (`resolveNavbarPayload.ts`, `lineageToNavbar.ts`, …), `localDevRuntime.ts`, `types.ts`, colocated `lib/*.test.ts` |
| [`preview-data/`](preview-data/) | **Dev/test only** — DXP manifest preview payloads (`preview.data*.json`). Referenced from `manifest.json` `previews` and Vitest; **not** imported by `main.ts`. |
| [`storybook-data/`](storybook-data/) | Storybook / Handlebars fixtures (`header.variant.*.data.json`); not used by Edge `main`. |
| [`handlebars/`](handlebars/) | `header.hbs`, `headerBrand.hbs` (Storybook / partial parity) |
| [`scss/`](scss/) | `header.scss`, `_header-variables.scss` (imported from `src/css/main.scss`) |
| [`js/`](js/) | `header.functions.js` (registered in `qld.bootstrap.js`) |

## Current state

| Asset | Status |
| ----- | ------ |
| Banner + brand + search | `lib/renderHeaderBanner.ts`, `lib/renderHeaderBrand.ts`, `lib/renderHeaderSearch.ts`; COA helper `renderCoaLogo` in [`src/components/shared/logo/`](../../shared/logo/) (shared with the footer); COA SVGs from [`src/images/logos/`](../../../images/logos/) |
| Primary nav | `lib/renderPrimaryNavbar.ts`; Matrix lineage or preview `previewNavigation` in `preview-data/*.json` via `lib/resolveNavbarPayload.ts` |
| Lineage | `lib/lineageToNavbar.ts` + [`src/components/utils/matrix/`](../../utils/matrix/README.md) |
| Editor | `data-sq-field` on manifest-authored banner/search fields when `info.ctx.editor` |
| `manifest.json` | `0.1.17` (lineage nav includes `page_content`, `page_standard`, and `page_redirect` assets and hides non-Type-1 links), five previews, `brandLayout` drives conditional inputs via JSON Schema `allOf` (lockup fields per Queensland Health brand architecture; banner palettes fixed in code), `navigation.layout` (`simpleList` \| `megaMenu`) and conditional `descriptionMetadataFieldKey`, `preHeader.globalLink` and dropdown `items` / `viewMore` as `SquizLink`, optional Matrix `environment` keys including `AMAPI_TOKEN` for local dev (nested objects need `"required": []` for DXP schema) |
| Tests | `header.test.ts`, `header.preview.test.ts`, `header.main.test.ts`, `lib/resolveNavbarPayload.test.ts`, `lib/resolveHeaderNavigationConfig.test.ts`, `lib/renderPrimaryNavbar.test.ts`, `lib/localDevRuntime.test.ts`, `lib/canResolveLineageNavigation.test.ts`, `lib/resolvePreviewNavigationFromInput.test.ts`, `lib/resolvePreHeaderGlobalLink.test.ts`, `lib/resolveHeaderSquizLinks.test.ts`, `lib/lineageToNavbar.test.ts`, `lib/resolveBrandLayout.test.ts`, `lib/resolveBrandContent.test.ts`, `lib/resolveBrandPalettes.test.ts`; site lineage: `enrichSectionNavigationDescriptions.spec.ts`, `metadataFieldValue.spec.ts` |

When Matrix env is complete and site lineage resolves to no navigation hubs, `main` still renders the **banner** (pre-header, brand, search) from manifest input; `renderPrimaryNavbar` omits the primary `<nav>` when the resolved item list is empty.

## Brand layout (`brandLayout`)

Editors choose a Queensland Health brand architecture layout in the manifest. **Lockup fields are conditional** on `brandLayout` (JSON Schema `allOf` in `manifest.json`, same pattern as [`promotionalPanel/manifest.json`](../promotionalPanel/manifest.json) — see [Squiz conditional fields](https://docs.squiz.net/component-service/latest/input-types/input-type-boolean.html)). Changing the quick option updates which inputs appear and their defaults.

`brandLayout` controls **which lockup fields exist** and **pre-header and main banner palette classes** — neither palette is editor-configurable. Render applies the prescribed classes per layout via `lib/resolveBrandPalettes.ts`. Named manifest previews (`default`, `subBrand`, `coBrand`, `endorsed`, `standAlone`) provide full fixtures per layout.

References: [Brand guidelines](https://www.design-system.health.qld.gov.au/brand-foundations/brand-guidelines), [Brand architecture](https://www.design-system.health.qld.gov.au/brand-foundations/brand-architecture), [Master](https://www.design-system.health.qld.gov.au/brand-foundations/master-brand), [Sub-brand](https://www.design-system.health.qld.gov.au/brand-foundations/sub-brand), [Co-brand](https://www.design-system.health.qld.gov.au/brand-foundations/co-brand), [Endorsed](https://www.design-system.health.qld.gov.au/brand-foundations/endorsed), [Stand-alone](https://www.design-system.health.qld.gov.au/brand-foundations/stand-alone). Cross-repo summary: [docs/ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md#queensland-health-header-brand-architecture).

| `brandLayout` | Pre-header / main palette (fixed in code) | Main lockup inputs (editor) | Render (primary) |
| ------------- | ----------------------------------- | --------------------------- | ---------------- |
| `masterBrand` | pre `dark`, main `default` | None (COA only) | `coa-master-brand` SVG |
| `subBrand` | pre `dark`, main `default` | `secondaryLockupType` → text or `secondaryLogo` | Stacked COA + secondary |
| `coBrand` | pre `default`, main `dark` | Site title + subline | Stacked COA + title block |
| `endorsedBrand` | pre `default`, main `dark-alt` | Primary + secondary `SquizImage` | Images or COA fallback |
| `standaloneBrand` | pre `dark-alt`, main `default` | Primary `SquizImage`, optional secondary | Agency logo |

Render-time enforcement: `lib/resolveBrandContent.ts` (lockups), `lib/resolveBrandPalettes.ts` (palettes), `lib/renderHeaderBrand.ts`.

## Primary navigation (`navigation`)

Manifest object for **lineage-built** primary nav (not the preview fixture tree):

| Field | When | Purpose |
| ----- | ---- | ------- |
| `navigation.layout` | Always (default `simpleList`) | `simpleList` or `megaMenu` for all hub dropdowns from site lineage |
| `navigation.descriptionMetadataFieldKey` | `megaMenu` only | **metadata_values** key on each child page asset (e.g. `page-lead` on Arts). Fetched with Content API `?data=metadata` on the page—not a metadata-field asset id |

**Eligible asset types:** lineage-built primary nav includes `page_content`, `page_standard`, and `page_redirect` assets (redirects link to their own URL). Other types such as bare `page` or `folder` are excluded.

**Hidden pages:** lineage-built primary nav shows only pages whose link from their parent is **Type 1 (menu)**. Type 2 (hidden), Type 3, notice and untyped links are omitted together with their descendants; they are not promoted into the parent dropdown. Rules: [CODING_STANDARDS.md](../../../../docs/CODING_STANDARDS.md#matrix-link-types-site-lineage). Preview `previewNavigation` fixtures are not filtered.

Lineage resolution applies `navigation.layout` and fetches child metadata when `megaMenu` and `descriptionMetadataFieldKey` are set ([`lib/resolveNavbarPayload.ts`](lib/resolveNavbarPayload.ts), [`lib/lineageToNavbar.ts`](lib/lineageToNavbar.ts)). Mega menu hubs show **at most nine** child links; when there are more, a **View more** link to the hub landing URL is appended. Local preview nav trees use **`previewNavigation`** in `preview-data/*.json` (not manifest schema).

## Pre-header links (`SquizLink`)

Manifest fields (see `manifest.json`):

| Field | Type |
| ----- | ---- |
| `preHeader.globalLink` | `SquizLink` (render defaults when unset: `lib/resolvePreHeaderGlobalLink.ts`) |
| `preHeader.actions[].dropdown.link` | `SquizLink` when `dropdown.type` is `none` |
| `preHeader.actions[].dropdown.type` | `none` (plain link + optional icon), `list`, `html`, or `form` |
| `preHeader.actions[].dropdown.text` | Dropdown toggle label when `type` is `list`, `html`, or `form` |
| `preHeader.actions[].dropdown.icon` | Icon suffix enum when `type` is `none` |
| `preHeader.actions[].dropdown.items[]` | `SquizLink` when `type` is `list` |
| `preHeader.actions[].dropdown.viewMore` | `SquizLink` when `type` is `list` |
| `preHeader.actions[].dropdown.HTMLContent` | `string` (`format: multi-line`) when `type` is `html` or `form` |

### HTML / form dropdown markup (XSS)

When `dropdown.type` is **`html`** or **`form`**, [`lib/renderPreHeader.ts`](lib/renderPreHeader.ts) outputs `dropdown.HTMLContent` **without** [`xssSafeContent`](../../utils/xss.js). That is intentional: editors enter raw markup in the multi-line field and need full control inside the dropdown menu (forms, embeds, rich HTML). List dropdowns, links, labels, and other pre-header strings still use `xssSafeContent`. Treat `HTMLContent` as trusted author HTML in Matrix (same idea as unescaped `{{{dropdown.HTMLContent}}}` in [`handlebars/header.hbs`](handlebars/header.hbs)).

Dropdown toggles use `preHeader.actions[].dropdown.text` when `dropdown.type` is `list`, `html`, or `form` (legacy `actions[].text` is still read in render). Matrix supplies `text`, `url`, optional `target`, and for internal links `matrixAssetId` ([Squiz docs](https://docs.squiz.net/component-service/latest/input-types/input-type-squiz-link.html)).

**Resolution in `main.ts`:** [`lib/resolveHeaderSquizLinks.ts`](lib/resolveHeaderSquizLinks.ts) calls [`resolveSquizLink`](../../utils/squizLink.ts) with `info.fns.resolveMatrixAssetById` for `preHeader` SquizLink fields and `mainContent.url` before `renderPreHeader` / `renderHeaderBanner`. Sync render uses `squizLinkHref` (and `squizLinkLabel` where needed) on the resolved links. In local dev with AMAPI configured, picks read the real URL through the Content API (see [`utils/squizLink.ts`](../../utils/squizLink.ts) and [`squizlink-notes.md`](../../../../docs/plans/footer-dxp/squizlink-notes.md)). Unresolved picks in `renderPreHeader` still render `#`; the footer drops them instead (open decision in the notes). Master-brand display defaults (`qld.gov.au` / `https://qld.gov.au`) when the global link is wholly unset are applied in [`lib/resolvePreHeaderGlobalLink.ts`](lib/resolvePreHeaderGlobalLink.ts) via `renderGlobalLink` (author `url`/`text`/`matrixAssetId` are not replaced by defaults when the field has content).

### Preview data vs Matrix input

| Source | Used by | Precedence |
| ------ | ------- | ---------- |
| Matrix / `dev:dxp` field UI | `main(input, info)` at render time | **Authoritative** for production |
| `preview-data/*.json` | Vitest (`preview.data.json` full master fixture), manifest `previews` | **Dev fixtures only** — may include preview-only `previewNavigation` / `navbarMetadata` (not in manifest schema) |
| `preview-data/preview.data.dxp.json` | Manifest **`default`** preview only (`dev:dxp` validation) | Slim master fixture: list dropdown `items` are `[]` because `dev:dxp` returns `InvalidTypeError` per nested `SquizLink` array entry (see [phase-squizlink-input-notes](../../../../docs/plans/header-dxp/phase-squizlink-input-notes.md)) |
| `storybook-data/*.json` | Storybook / `Header.js` (Handlebars) | Not Edge output |

`main.ts` passes the `input` argument through to `renderHeaderBanner` unchanged. Tests that need preview shapes import JSON explicitly and call `main(fixture)`; author-input tests pass inline objects without preview files.

## Parity checklist (Storybook vs DXP)

| Check | Storybook | DXP preview key |
| ----- | --------- | ---------------- |
| Master brand + search + pre-header dropdown | `MasterBrand` | `default` |
| Sub-brand title + icon pre-header links | `SubBrand` | `subBrand` |
| Co-brand custom logo + title/subline | `CoBrand` | `coBrand` |
| Endorsed COA + secondary logo | `Endorsed` | `endorsed` |
| Standalone agency logo | `StandAlone` | `standAlone` |
| Primary navbar (dropdowns, external targets) | `Navbar` story data | Matrix lineage when env allows; else preview-only `previewNavigation` in `preview-data/*.json` |
| Home link icon-only (`hideLabel`) | `navbar.data.json` Home item | Preview `previewNavigation` includes Home; **lineage** prepends Home via `lineageToNavbar` + `resolveHeaderHomeUrl` |
| Dark navbar (`metadata.alternativeColor`) | Navbar story control | Preview `navbarMetadata` in preview-data; lineage path defaults to light nav (see [phase-6-notes](../../../../docs/plans/header-dxp/phase-6-notes.md)) |

Compare Edge HTML with `handlebars/header.hbs`, `storybook-data/header.variant.*.data.json`, and Storybook `2. Layout/Header`. See [docs/MIGRATION_HBS_TO_DXP.md](../../../../docs/MIGRATION_HBS_TO_DXP.md).

## Environment

Set on the **component set** in Matrix for production. For `npm run dev:dxp`, copy the same keys into repo [`.env`](../../../../.env) (never commit secrets); [scripts/dev-dxp.mjs](../../../../scripts/dev-dxp.mjs) forwards manifest `environment` keys (including `AMAPI_TOKEN`) into Miniflare as strings.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `API_IDENTIFIER` | Production lineage | Matrix Content API identifier (legacy `__api` paths) |
| `BASE_DOMAIN` | Production lineage | Site origin |
| `BASE_PATH` | Production lineage | Site path prefix |
| `MX_API` | Production lineage | Content API base (not the `dev-dxp` localhost placeholder) |
| `BEARER_AUTH` | Production lineage | Content API bearer token |
| `AMAPI_TOKEN` | Local dev only | AMAPI bearer for `dev:dxp` when Content API credentials are incomplete; read from `info.env` in Miniflare (declared on header `manifest.json` `environment`) |
| `AMAPI_CACHE_TTL_WEEKS` | No | Local preview AMAPI cache TTL (weeks); see matrix README |
| `AMAPI_DISK_CACHE` | No | Set `1` in repo `.env` for disk cache + localhost `:4000` proxy |
| `SITE_ROOT_ASSET_ID` | No | Site root asset for lineage (default `465` in matrix utils) |
| `BASE_URL` | Local `.env` | Maps to `BASE_DOMAIN` / `MX_API` when those are unset |
| `IS_LOCAL` | No | Cut-up / local flags via [`localDevRuntime.ts`](../../utils/matrix/localDevRuntime.ts) (header `lib/localDevRuntime.ts` re-exports it) |
| `LOCAL_FUNNELBACK_SUGGEST_URL` | Local autosuggest | Browser `data-suggestions` URL when `IS_LOCAL` (default via `dev-dxp.mjs`: `http://localhost:4000/__funnelback-suggest`) |
| `FUNNELBACK_SUGGEST_UPSTREAM` | Local proxy only | Upstream Funnelback `suggest.json` base; starts localhost proxy — see [matrix README](../../utils/matrix/README.md#local-funnelback-suggest-proxy-devdxp-only) |

**Site search manifest fields** (`assets.siteSearch`): `enabled` (`show` / `hide`), `searchResultsUrl`, `autosuggestUrl`, `collection`, `profile`, optional `numRanks` / `tiers`. Form submit and suggestion picks use [`search.functions.js`](../searchInput/search.functions.js) with Arts defaults in `preview-data/*.json`.

**Author field:** `siteRootAssetId` on the header component overrides `SITE_ROOT_ASSET_ID` for primary nav lineage.

### Primary nav resolution (preview vs lineage)

[`resolveNavbarPayload`](lib/resolveNavbarPayload.ts) uses this order:

1. **Manifest preview fixtures (`dev:dxp`):** when `IS_LOCAL` is true and preview JSON includes `previewNavigation` / `navbarMetadata`, use fixture nav only — **no AMAPI/lineage fetch** (even if `AMAPI_TOKEN` is in `.env`).
2. **Matrix lineage** when [`canResolveLineageNavigation`](lib/canResolveLineageNavigation.ts) is true (production Edge Content API, or local tests without preview `previewNavigation` on `input`).
3. **Preview fixtures** on `input` when lineage env is not configured.
4. **Empty nav:** banner still renders; `renderPrimaryNavbar` omits the primary `<nav>`.

To exercise live Arts IA in local dev, use preview data without embedded `previewNavigation` or call `main` without preview `previewNavigation` on `input` (manual `dev:dxp` with `.env` — not live Matrix in Vitest).

Lineage HTTP uses [`resolveLineageContentApiFetchImpl`](../../utils/matrix/contentApiLocalProxy/resolveLineageContentApiFetchImpl.ts) when AMAPI is configured (in-worker synthesis, or HTTP to localhost `__api` when disk cache is enabled); otherwise Content API `fetch` on Edge. **Local AMAPI cache** (TTL weeks, invalidation): [matrix README](../../utils/matrix/README.md#local-amapi-preview-cache-devdxp-only), [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md#local-amapi-preview-cache).

DXP dev-ui runs inside Miniflare/workerd: `process.env` and `node:*` are not available in the Edge bundle. AMAPI and Matrix env for previews must come from manifest `environment` + `.env` via `dev-dxp.mjs`. **`ensureLocalProjectEnvLoaded`** is for the Node dev-ui host only.

**Restart `npm run dev:dxp`** after changing `manifest.json`, manifest `environment`, or `preview-data/*.json`.

## Preview

- DXP: `npm run dev:dxp` — component `header` (`:5555` render, `:3000` fields). Default preview uses `preview.data.dxp.json` (empty dropdown `items`); use the field UI or `preview.data.json` in tests for full list markup. Endorsed/standalone preview logos use `SquizImage` objects with absolute `imageVariations.original.url` (same pattern as `banner/preview.data.json`); relative `assets/img/*` paths do not resolve in the DXP dev server.
- [`preview.html`](preview.html) uses the **public QGDS CDN** for `qld.bootstrap.css` / `qld.bootstrap.min.js` (same pattern as other DXP components). Edge header markup must work with that bundle; do not require a local `dist/` build for preview.
- Storybook: `npm run storybook` — `2. Layout/Header`

## Related docs

- [docs/plans/header-dxp/README.md](../../../../docs/plans/header-dxp/README.md)
- [SquizLink input investigation (Phase 1)](../../../../docs/plans/header-dxp/phase-squizlink-input-notes.md)
- [docs/plans/header-dxp/phase-6-notes.md](../../../../docs/plans/header-dxp/phase-6-notes.md)
- [docs/plans/header-dxp/phase-brand-inputs-notes.md](../../../../docs/plans/header-dxp/phase-brand-inputs-notes.md)
- [docs/CODING_STANDARDS.md](../../../../docs/CODING_STANDARDS.md)
- [docs/plans/amapi-local-preview-cache/README.md](../../../../docs/plans/amapi-local-preview-cache/README.md)
