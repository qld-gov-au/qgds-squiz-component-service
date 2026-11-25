# Content — main

Page layout for the **main content region** of a standard QGDS content page: a **side navigation** column and a **primary content** column inside the centred container grid (`col-lg-3` + `col-lg-8`), matching the structure used in the `contentPageWithSideNavigation` page template in the source components repo.

Header, footer, banner, and breadcrumbs are supplied by the Matrix page template (or other layouts), not this layout. For full-width section blocks without side nav, use [content-section-1-column](../content-section-1-column/) or [landing-main](../landing-main/).

## Manifest

| Field | Value |
| ----- | ----- |
| **Name** | `content-main` |
| **Display name** | Content — main |
| **Entry** | `markup.hbs` |
| **Config** | `manifest.json` |

## Zones

| Key | Display name | Role |
| --- | ------------ | ---- |
| `sidenav` | Side navigation | `{{zones.sidenav}}` in the `col-12 col-lg-3` column |
| `main` | Main content | `{{zones.main}}` inside `<main class="px-lg-32">` |

## Markup

`markup.hbs` renders:

- `.container.mt-40.mt-lg-64` outer wrapper
- `.row` with side nav then main column (`mt-40 mt-lg-0` on the main column for mobile spacing)
- Semantic `<main class="px-lg-32">` around the main content zone

The grid uses **3 + 8** columns at the large breakpoint (11/12), consistent with existing QGDS page templates.

## Local development

From this folder:

```bash
dxp-next page layouts dev --config ./manifest.json --zones=sidenav=./sidenav.html,main=./main.html
```

Edit `sidenav.html` and `main.html` to prototype each zone. Deploy and register the layout in Matrix per your DXP page-layout workflow.
