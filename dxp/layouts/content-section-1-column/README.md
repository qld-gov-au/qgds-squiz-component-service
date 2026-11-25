# Content section - 1 column

Page layout with **one content column** in a standard Bootstrap `container` inside a padded `<section>`. Use for general content pages where editors stack body components in a single column (no side navigation column in this layout).

Site chrome (header, footer, optional banner or breadcrumbs) is supplied by the Matrix page template, not this layout. For two or three equal columns, use [content-section-2-columns](../content-section-2-columns/) or [content-section-3-columns](../content-section-3-columns/). For full-bleed landing pages, use [landing-main](../landing-main/).

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `content-section-1-column` |
| **Display name** | Content section - 1 column |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `content` | Main content | Single column; markup `{{zones.content}}` inside `.container`. |

## Markup

`markup.hbs` renders:

- Outer `<section class="py-5">` for vertical spacing
- Inner `.container` centring the column
- Zone output for editor-placed components

## Local development

From this folder:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=content=./content.html
```

Edit `content.html` to prototype zone markup. Deploy and register the layout in Matrix per your DXP page-layout workflow.
