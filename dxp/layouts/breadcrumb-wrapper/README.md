# Breadcrumb wrapper

Page layout that wraps **breadcrumbs** in the QGDS **no-banner** banner grid (`qld-banner qld-banner-grid no-banner`), so breadcrumb trails align with banner/breadcrumb styling on content pages without a hero banner.

Header, footer, and main body are supplied elsewhere in the page template.

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `breadcrumb-wrapper` |
| **Display name** | Breadcrumb wrapper |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `breadcrumbs` | Breadcrumbs | `{{zones.breadcrumbs}}` inside `.banner-breadcrumbs` |

## Markup

`markup.hbs` renders the fluid banner inner shell only; editors place the breadcrumbs component in the single zone.

## Local development

From this folder:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=breadcrumbs=./breadcrumbs.html
```

Edit `breadcrumbs.html` to prototype the zone. Deploy and register the layout in Matrix per your DXP page-layout workflow.
