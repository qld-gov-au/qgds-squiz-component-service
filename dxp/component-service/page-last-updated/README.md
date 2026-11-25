> Ported from the QGDS source repo. File paths, `npm run` commands and Storybook references below describe the source repo; in kernel use `npx vitest run dxp/component-service/page-last-updated` and `npm run cmp`. Preview fixtures are `example*.data.json`.

# Page last updated

Outputs the last updated date of the page the component is placed on, as `31 January 1900`, in the `qld-content-dates` markup. Nothing is editable. Place it on a content template, next to the page title.

## DXP

- **Manifest name:** `page-last-updated`
- **Namespace:** `qgds-bs5`
- **Entry:** `main.ts` (`mainFunction: "main"`)
- **Version:** `0.2.0` (bump on deploy-worthy changes)

## CMS fields

None. The input object has no properties. The date comes from the page the component is placed on: the `updated.date` value in the Matrix Content API asset response for the asset whose id matches `ctx.assetId`. To change the date, the page must be updated in Matrix.

Date values:

- `YYYY-MM-DD` (for example `1900-01-31`) is shown as written.
- A date and time with no zone (for example `2026-02-01T09:00:00`) is shown with the date as written.
- A date and time with a zone (`Z`, `+10:00`, `-05:00`) is converted to the Queensland date, which is UTC+10 with no daylight saving. The sample `2019-08-24T14:15:22Z` shows `25 August 2019`.
- Anything else, including impossible dates such as `2026-02-30`, shows nothing.

The day is always two digits (`05 March 2026`). Month names are English and fixed, so the output does not depend on the runtime's locale.

## Markup

The output matches the design system markup. The label text `Last updated:` is fixed in `main.ts`:

```html
<dl class="qld-content-dates my-0">
  <dt class="my-0">Last updated:</dt>
  <dd class="my-0">31 January 1900</dd>
</dl>
```

The date is built from parsed date parts only, so it needs no escaping. There are no `data-sq-field` attributes, so the component is not inline editable.

## Behaviour

| Context                                      | Output                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Placed on a page                             | Markup with the placed page's `updated.date`. Empty when the field is missing or not a date, or the request fails.  |
| No placement, local dev, editor or Storybook | Markup with the mock date from `preview-last-updated.json` (`31 January 1900`). No Matrix request.                  |
| No placement, live page                      | Empty.                                                                                                              |

Placement is resolved in this order, using the first non-empty value: `ctx.assetId`, `ctx.parentAssetId`, `ctx.pageAssetId`, then `info.assetId`. A `pageUrl`-only placement renders nothing on a live page.

## Notes

- **Missing or invalid dates render nothing.** The component does not show a fallback, so an asset without `updated.date` shows no date line.
- **The date changes on any asset update**, including edits that don't change the page content.
- **Time zone assumption:** a date and time with no zone is taken as written. If Matrix stores these values in UTC, change `parseLastUpdated` in `formatLastUpdated.ts` to convert them.
- **Each live render** makes one Matrix request for the placed asset, with no `data` parameter, so the default asset response is used. A failed or unreadable request renders nothing.
- **Not wired into any template.** Editors place it on the content template. Check the page's `updated.date` is present in the Content API before publishing.

## Styles and scripts

- SCSS: none. The `qld-content-dates` styling comes from the published QGDS CSS.
- JS: none.

## Tests

- **Files:** `main.test.ts` (component output, placement, previews and failures) and `formatLastUpdated.test.ts` (date parsing and formatting)
- **Covers:** markup for placed and preview output, `updated.date` being read, the sample timestamp converting to `25 August 2019`, `last-updated` metadata being ignored, a missing or invalid `updated` field, failed and throwing requests, the absence of a `data` parameter on the request, no `data-sq-field`, and empty output on a live page without placement (no request made). The formatting tests cover UTC and offset conversion to the Queensland date, zone-less dates, two-digit days and invalid dates.
- Run: `npx vitest run src/components/bs5/pageLastUpdated`

## Preview

- **Mock data:** `preview-last-updated.json` (`lastUpdated`, `1900-01-31`)
- **DXP:** `npm run dev:dxp`, then open `http://localhost:3000/#/c/qgds-bs5/page-last-updated/0.2.0` (field UI) or `http://localhost:5555/dev/render/qgds-bs5__page-last-updated__0.2.0?_previewKey=default` (render).
