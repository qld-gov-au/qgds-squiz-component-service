# Blockquote

A quotation with an optional source link and author.

## DXP

- **Manifest name:** `blockquote`
- **Namespace:** `qgds-bs5`
- **Version:** `0.1.0`
- **Entry:** `main.js`

## CMS fields

| Field            | Notes                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| `content`        | Required. The quote text. Inline editable. Filtered with `xssSafeContent`.    |
| `citeText`       | The author. Inline editable. Left out of live output when empty.              |
| `citeUrl`        | The source URL. Written to the `cite` attribute, escaped.                     |
| `wrapperClasses` | Classes for the outer `div`, escaped.                                         |
| `classes`        | Extra classes on the `figure`, escaped.                                       |

**Empty output.** Live output is `""` when `content` is empty. In edit mode the markup is kept, so the editor can type into the quote and the author field.

## Styles and scripts

- SCSS: `css/blockquote.scss`. Supports `.alt`, `.dark` and `.dark-alt` parent backgrounds.
- JS: none.

## Tests

`npx vitest run dxp/component-service/blockquote`
