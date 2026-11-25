# Nested content

Embeds the page content of another Matrix asset (selected via the Squiz asset picker) into the current page using an ESI include. Used to pull shared content from other locations in Matrix into a page.

## DXP

- **Manifest name:** `nested-content`
- **Namespace:** `qgds-bs5`
- **Version:** `0.0.1` (first deploy). Bump `manifest.json` `version` on deploy-worthy changes.
- **Entry:** `main.ts` (`mainFunction: "main"`, `responseType: "html"`)

## CMS fields

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `matrixAsset` | `matrix-asset-uri` | Yes | The asset whose content is embedded. Missing or empty values render a configuration error. |

See `manifest.json` for the full schema.

## Behaviour

- **Pages mode only.** The component always emits an ESI include:
  `<esi:include src="{assetUrl}?SQ_ASSET_CONTENTS_RAW&SQ_SESSION_MODE=read_only_async" />`
- **Page query forwarding.** Non-`SQ_` query params on the embedding page (`info.ctx.url`) are forwarded onto the ESI `src`, so the embedded content can read them. `SQ_*` params are never forwarded.
- **Asset resolution.** The `matrixAsset` URI is resolved to a public URL via `info.fns.resolveUri`.
- **Error state.** If the asset is not selected, cannot be resolved, has no URL, or resolution throws, the component returns a `nested-content__error` paragraph. The asset URI in the message is HTML-escaped.
- **Out of scope.** Custom Forms mode (AJAX load and form submission), the `thankYouClassName` field, and any client-side JS are intentionally not included.

## Markup parity

No co-located `*.hbs` or Storybook story. Behaviour is taken from the ORV `nested-content` reference implementation, reduced to Pages mode.

## Styles and scripts

- SCSS: none. The error paragraph uses default paragraph styling, so nothing is registered in `src/css/main.scss`.
- JS: none. No `*.functions.js`, so nothing is registered in `src/js/qld.bootstrap.js`.

## Tests

- **File:** `main.test.ts`
- **Covers:** ESI include construction, `SQ_` param filtering and page-param forwarding, `hasMatrixAssetSelection`, `getAssetUrl` (including failure paths), `main` configuration errors (missing, empty, whitespace, unresolved, throwing), and HTML escaping of the asset URI in the error message.
- **Fixtures only:** `resolveUri` is mocked with `vi.fn()`. No live Matrix Content API or AMAPI calls.
- Run: `npx vitest run dxp/component-service/nested-content`

## Preview

- DXP: `npm run dev:dxp`. Preview data is `example.data.json`, wrapped in `preview.html`. The manifest has no `mockedUris`, so the preview resolves `matrixAsset` against the live Matrix instance. Without a connection the preview shows the configuration error.
- Restart `npm run dev:dxp` after changing `manifest.json` or preview payloads.
