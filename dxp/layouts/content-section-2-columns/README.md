# Content section - 2 columns

Page layout with **two equal columns** (`col-md-6`) in a Bootstrap row inside a padded `<section>`. Columns stack on small viewports and sit side by side from the medium breakpoint up.

Site chrome (header, footer, optional banner or breadcrumbs) is supplied by the Matrix page template, not this layout. For a single column, use [content-section-1-column](../content-section-1-column/). For three columns, use [content-section-3-columns](../content-section-3-columns/). For full-bleed landing pages, use [landing-main](../landing-main/).

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `content-section-2-columns` |
| **Display name** | Content section - 2 columns |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `column1` | Column 1 | First column; `{{zones.column1}}` |
| `column2` | Column 2 | Second column; `{{zones.column2}}` |

## Markup

`markup.hbs` renders:

- Outer `<section class="py-5">` for vertical spacing
- `.container` > `.row` > two `.col-md-6.mb-4` cells, one zone each

## Local development

From this folder:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=column1=./column-1.html,column2=./column-2.html
```

Edit the `column-*.html` files to prototype each zone. Deploy and register the layout in Matrix per your DXP page-layout workflow.
