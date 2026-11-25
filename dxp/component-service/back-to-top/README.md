# Back to top

A "Back to top" link, usually placed at the end of a long page. It scrolls the page to the top when clicked. It uses the QGDS direction-link style with an up arrow.

## DXP

- **Manifest name:** `back-to-top`
- **Namespace:** `qgds-bs5`
- **Version:** `0.1.0`. Bump `manifest.json` `version` on deploy-worthy changes.
- **Entry:** `main.js`

## CMS fields

- **Label** (`label`): link text. Defaults to "Back to top". Inline editable in the preview column.
- **Href** (`href`): link target. Defaults to `#`. Script-capable schemes (`javascript:`, `data:`, `vbscript:`) fall back to `#`.
- **Position** (`position`): `left` (default) or `right`. Right adds `ms-auto` to the link. Quick option in the capsule.
- **Wrapper classes** (`wrapperClasses`): extra classes on an outer `div`. Optional. The outer `div` is only rendered when this is set.

## Markup parity

Matches `backToTop.hbs` by default:

- `div.back-to-top.d-print-none > a.qld-dir-link.up[href]` with the direction arrow icon.

Differences from the Handlebars version:

- The Handlebars `hide_back_to_top` flag is not in the DXP manifest. The DXP component always renders. Storybook keeps the flag through `backToTop.hbs`.
- `wrapperClasses` is DXP-only. Its value is escaped before it is written to the attribute.
- `label` and `href` are escaped. The label passes through `xssSafeContent`. The href is escaped and falls back to `#` for script-capable schemes.

## Styles and scripts

- **SCSS:** no component SCSS. The `.qld-dir-link` styles come from the QGDS stylesheet loaded by `preview.html`.
- **JS:** `js/frontend.js` ports `backToTop()` (double-bind guarded). It sets `scrollTop` to 0 and cancels the hash jump.

## Tests

- **File:** `main.test.js`. Run from `kernel/`: `npx vitest run dxp/component-service/back-to-top`.
