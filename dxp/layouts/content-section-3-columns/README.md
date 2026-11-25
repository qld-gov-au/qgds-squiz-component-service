# Content section - 3 columns

Page layout with **three equal columns** (`col-md-4`) in a Bootstrap row inside a padded `<section>`. Columns stack on small viewports and sit side by side from the medium breakpoint up.

Site chrome (header, footer, optional banner or breadcrumbs) is supplied by the Matrix page template, not this layout. For a single column, use [content-section-1-column](../content-section-1-column/). For two columns, use [content-section-2-columns](../content-section-2-columns/). For full-bleed landing pages, use [landing-main](../landing-main/).

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `content-section-3-columns` |
| **Display name** | Content section - 3 columns |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `column1` | Column 1 | First column; `{{zones.column1}}` |
| `column2` | Column 2 | Second column; `{{zones.column2}}` |
| `column3` | Column 3 | Third column; `{{zones.column3}}` |

## Markup

`markup.hbs` renders:

- Outer `<section class="py-5">` for vertical spacing
- `.container` > `.row` > three `.col-md-4.mb-4` cells, one zone each

## Local development

From this folder:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=column1=./column-1.html,column2=./column-2.html,column3=./column-3.html
```

Edit the `column-*.html` files to prototype each zone. Deploy and register the layout in Matrix per your DXP page-layout workflow.
