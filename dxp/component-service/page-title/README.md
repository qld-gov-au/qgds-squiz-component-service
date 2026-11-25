> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/page-title` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Page title

Outputs the name of the page the component is placed on, wrapped in an `<h1>`. Nothing else is output: no wrapper, no classes, no CMS fields.

Intended for content pages where the page name is the main heading, such as the Business Queensland grant guide pages (for example [How to prepare and write a grant application](https://www.business.qld.gov.au/running-business/support-services/financial/grants/prepare-write-application)).

## DXP

- **Manifest name:** `page-title`
- **Namespace:** `qgds-bs5`
- **Entry:** `main.ts` (`mainFunction: "main"`)
- **Version:** `0.1.0` (bump on deploy-worthy changes)

## CMS fields

None. The input object has no properties. The name comes from the page the component is placed on: the Matrix site lineage asset whose id matches `ctx.assetId`. To change the output, rename the page in Matrix.

## Behaviour

| Context                                      | Output                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Placed on a page                             | `<h1>` with the placed asset's name. Empty when the asset is not in the lineage, has a blank name, or the lineage request fails. |
| No placement, local dev, editor or Storybook | `<h1>` with the mock name from `preview-title.json`. No Matrix request.                                                          |
| No placement, live page                      | Empty.                                                                                                                           |

Placement is resolved from `ctx.assetId` only. A `pageUrl`-only placement renders nothing on a live page.

## Markup parity

New component with no `.hbs` counterpart. The output is `<h1>{name}</h1>` with no classes, so the QGDS heading styles apply.

The name is escaped as plain text, including quotes. `xssSafeContent` only filters tags, so it would still let an `<img>` through.

## Notes

- **One `<h1>` per page.** A banner with a title also outputs an `<h1>`. Do not place both on the same page without checking.
- **Not wired into any template.** Editors place it in the content area. No Handlebars page layout uses it yet.
- **Lineage request:** each live render makes one Matrix lineage request with `expandSectionChildren: false`.

## Styles and scripts

- SCSS: none.
- JS: none.

## Tests

- **File:** `src/components/bs5/pageTitle/main.test.ts`
- **Covers:** name output for the placed asset (matched by id), escaping of markup and quotes, trimming, empty output (asset missing, blank name, failed request), editor output when placed, mock output in the editor, local dev and Storybook, and empty output on a live page without placement (no request made).
- Run: `npx vitest run src/components/bs5/pageTitle`

## Preview

- **Mock data:** `preview-title.json` (`name`).
- **DXP:** `npm run dev:dxp`, then open `http://localhost:3000/#/c/qgds-bs5/page-title/0.1.0` (field UI) or `http://localhost:5555/dev/render/qgds-bs5__page-title__0.1.0?_previewKey=default` (render).
