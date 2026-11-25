# Raw code

Outputs author-entered HTML unchanged. Use it for embeds that need markup or scripts the editor controls, such as third-party form scripts. Ported from the Outdoor Recreation Victoria `raw-code` example.

## DXP

- **Manifest name:** `raw-code`
- **Namespace:** `qgds-bs5`
- **Version:** `0.0.1` (bump `manifest.json` `version` on deploy-worthy changes)

## CMS fields

- **`rawCode`** (`string`, multi-line, required): HTML inserted as-is. Blank or whitespace-only values render nothing.

## Security

This component is a **documented exception** to `xssSafeContent`. `rawCode` is not sanitised, so `<script>`, `<form>`, and event-handler attributes are output exactly as entered.

- Only trusted editors should use this component.
- Do not place it on pages that render untrusted user input.
- The same exception applies to header `dropdown.HTMLContent` (see [`docs/CODING_STANDARDS.md`](../../../../docs/CODING_STANDARDS.md)).

## Markup parity

No Handlebars template. The output is the `rawCode` string, as in the Outdoor Recreation Victoria example.

## Styles and scripts

- No SCSS. Nothing to register in `src/css/main.scss`.
- No client JS. Nothing to register in `src/js/qld.bootstrap.js`.
- No inline editing (`rawCode` is not inline-editable), so there is no `data-sq-field`.

## Tests

- **File:** `main.test.ts`
- **Covers:** passthrough of scripts and attributes; `undefined`, `{}`, blank, and non-string input return `""`; the preview fixture renders unchanged.
- Run: `npm run test:run` (or `npx vitest run src/components/bs5/rawCode`)

## Preview

- DXP: `npm run dev:dxp` (restart the dev server after changing `manifest.json` or preview data)
- Preview data: `example.data.json`, wrapped in `preview.html` with the QGDS Bootstrap CSS.
