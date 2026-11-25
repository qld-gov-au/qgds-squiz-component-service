# Card (Advanced)

QGDS Bootstrap 5 card grid. Each card can have a featured layout, an image, an icon, a video overlay, a body and a footer. The markup is built by the helpers in `kernel/dxp/utils/Card/`.

## DXP

- **Manifest name:** `cards-advanced`
- **Namespace:** `qgds-bs5`
- **Version:** `0.1.0`. Bump `manifest.json` `version` on each deploy-worthy change.
- **Entry:** `main.js`

## CMS fields

| Field | Notes |
| ----- | ----- |
| `settings.variant`, `wrapperClasses`, `action`, `isArrowVisible`, `isEqualHeight` | Grid and card-wide settings. `wrapperClasses` is escaped. |
| `cards[].heading` | `headingTag` (h2 to h6, otherwise h3), `title` (inline editable), `link` (SquizLink). |
| `cards[].body` | `date` and `content` (both inline editable). |
| `cards[].image` | `enabled`, `source` (Matrix or External), `matrix` (SquizImage), `external` (URL and alt). |
| `cards[].icon` | `enabled`, `iconClass`, `position` (top or left). |
| `cards[].feature` | `enabled`, `imagePosition`. |
| `cards[].video` | `enabled`, `duration` (inline editable). |
| `cards[].footer` | `enabled`, `content` (inline editable), `cta` (SquizLink), `links` (`default` or `tags`, each item a SquizLink). |

## Links and URLs

- **Matrix asset links:** `main.js` resolves every SquizLink (`heading.link`, `footer.cta` and `footer.links.items[].link`) with `resolveSquizLink` before rendering. A link that cannot be resolved to a URL is dropped. The heading then shows its title as plain text.
- **Unsafe URLs:** only `http`, `https`, `mailto`, `tel`, relative and anchor URLs are rendered. Anything else, such as `javascript:`, is dropped.
- **Targets:** only plain window names (for example `_blank`) are rendered.

## Escaping

- Attribute values pass through `escapeAttribute`, `safeUrl`, `safeTarget` and `cssUrl` in `kernel/dxp/utils/Card/helpers/attributes.js`.
- The kernel `Cta` and `Link` helpers escape their own attributes, so the footer passes them unescaped values. Tag markup is built by hand and escaped in the footer helper.
- An image with alt text is exposed with `role="img"` and `aria-label`.
- `headingTag` is limited to h2 to h6.

## Empty output and edit mode

- Live output is `""` when `cards` is empty.
- In live mode, empty date, content, image, video duration and footer are left out.
- In edit mode, the targets for those fields stay in the markup so an editor can add content.

## Known gaps and decisions

1. **External image is an ad hoc field.** `image.external` stores a URL and alt text rather than a SquizImage. It is kept deliberately, with its URL and alt escaped.
2. **Sample data follows the Handlebars names.** `equalHeight` and `"action": "no"` in the example data match `card.hbs`. The manifest uses `isEqualHeight` and `none`.
3. **Accessibility of the arrow icon.** The arrow icon in the heading is not marked `aria-hidden`.

## Styles and scripts

- SCSS: `css/card.scss`, auto-included by `src/styles/main.scss`.
- JS: none.

## Tests

- **File:** `main.test.js`
- **Covers:** empty output, the escaping and URL rules above, SquizLink resolution through a mocked `info.fns`, edit-mode targets and live-mode omissions.
- **Run:** `npx vitest run dxp/component-service/card`

## Preview

- `default` preview uses `example.no-action.data.json`. `example.single-action.data.json` and `example.multi-action.data.json` are extra sample data.
