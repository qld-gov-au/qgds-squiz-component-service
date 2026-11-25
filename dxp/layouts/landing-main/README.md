# Landing — main

Page layout for **landing-style pages**: a single full-width main region with no side navigation or narrow content column. Site chrome (for example QGDS header and footer) is supplied by the Matrix page template, not this layout.

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `landing-main` |
| **Display name** | Landing — main |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `wide` | Main content | Editors place components in one fluid column (`container-fluid`). Markup: `{{zones.wide}}` in `markup.hbs`. |

## Markup

`markup.hbs` wraps the zone in `<main>` and a padding-free fluid container so edge-to-edge components (banners, full-bleed sections) can render correctly.

## Local development

From this folder, preview the layout with mock HTML for the main zone:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=wide=./wide-content.html
```

Adjust `wide-content.html` to prototype zone content. Deploy and register the layout in Matrix per your DXP / page-layout workflow (see Squiz page layout documentation).
