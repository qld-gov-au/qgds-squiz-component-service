# Content footer

Page layout for the **QGDS content footer** row: **content info** on the left and **back to top** aligned to the end on medium screens and up.

Place inside the main content container/grid where the legacy `contentFooter` pattern appears. Site-wide footer chrome remains on the page template.

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `content-footer` |
| **Display name** | Content footer |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `contentInfo` | Content info | `{{zones.contentInfo}}` in `.col-auto` |
| `backToTop` | Back to top | `{{zones.backToTop}}` in the flex end column |

Zone `key` values must be valid Handlebars path segments (no hyphens). DXP zone validation only recognises `{{zones.key}}` references.

## Markup

`markup.hbs` renders `.mt-64` wrapper, `.row.mb-64`, and the two-column responsive layout from the QGDS content footer pattern.

## Local development

From this folder:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=contentInfo=./content-info.html,backToTop=./back-to-top.html
```

Edit the mock HTML files to prototype each zone. Deploy and register the layout in Matrix per your DXP page-layout workflow.
