# QGDS Bootstrap5 Squiz Component Service

## Overview

Proof of Concept (PoC) for the DXP Component Service using Bootstrap 5 implementation of the Queensland Government Design System (QGDS) and Squiz.

## Status

Early exploration phase - individual user stories being prototyped across team branches.

## Getting Started

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) and the Node version in `.nvmrc` (`package.json` requires Node `>=24`)
- npm
- The Squiz DXP CLI:

  ```
  npm i -g @squiz/dxp-cli-next
  ```

### Installation

```
cd kernel
nvm use
npm install
```

### Environment variables

Copy the example file and edit it. `.env` is gitignored and must not be committed.

```
cp .example.env .env
```

| Variable           | Purpose                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_DOMAIN`      | Matrix domain that components fetch data from.                                                                                                  |
| `BASE_PATH`        | API path on the Matrix domain.                                                                                                                  |
| `API_IDENTIFIER`   | API identifier used when fetching data.                                                                                                         |
| `IS_LOCAL`         | Set to `"true"` for local dev. Page title, page last updated, breadcrumbs and header show mock preview content only when this is true and the component has no placement. |
| `CMP_DEBUG_TIMING` | Optional. Set to `"true"` to emit `[CMP DEBUG]` timing logs. Off by default.                                                                    |

If a component needs one of these variables, also declare it in the component's `manifest.json`:

```json
"environment": [
  { "name": "API_IDENTIFIER", "required": false },
  { "name": "BASE_DOMAIN", "required": false },
  { "name": "BASE_PATH", "required": false }
]
```

### Running locally

```
npm run dev
```

This starts the Edge component dev UI (`npm run cmp`) and the Vite dev server (`npm run server`, which waits for port 5555). Open:

1. `http://localhost:4000` - Development frontend with linked styles and scripts and Hot Module Replacement.
2. `http://localhost:5555` - Edge Component development webserver with a raw preview of each component.
3. `http://localhost:3000` - CMS-like UI showing how component fields are presented in Matrix.

Known issue: if you stop and re-run `npm run dev` while `http://localhost:4000` is open, you will see console errors. Close the page, then re-run the command.

### Project structure

```
dxp/
├── component-service/
│   ├── <component>/
│   │   ├── example.data.json
│   │   ├── main.ts (or main.js)
│   │   ├── main.test.ts (or main.test.js)
│   │   ├── manifest.json
│   │   ├── preview.html
│   │   └── README.md
├── layouts/
└── utils/
src/
```

- `example.data.json` - Example data passed to the component, used in previews and DXP.
- `main.ts` / `main.js` - The component logic and markup.
- `manifest.json` - Links the component files, defines preview data and CMS input configuration. See [Preview Configuration](https://docs.squiz.net/component-service/latest/preview/preview-configuration.html) and [Edit Manifest File](https://docs.squiz.net/component-service/latest/tutorials/build-a-basic-component/edit-manifest-file.html).
- `preview.html` - Wrapper used when previewing the component.
- `dxp/utils` - Shared utilities (for example XSS sanitising and the debug timing helper).
- `src/` - Shared scripts, styles, variables and fonts used for development and the built output.

### Testing, linting and type checking

| Command                | Description                                 |
| ---------------------- | ------------------------------------------- |
| `npm run test`         | Run Vitest tests with coverage              |
| `npm run typecheck`    | Run the TypeScript compiler without emitting |
| `npm run lint:css`     | Run Stylelint on SCSS                       |
| `npm run lint:js`      | Run ESLint                                  |
| `npm run prettier`     | Check formatting                            |
| `npm run fix:all`      | Auto-fix CSS, JS and formatting issues      |

Run these before pushing changes. Enabling Prettier's "Format on save" in your IDE is recommended.

### Building

```
npm run build
```

### Deploying a component

Log in to the target tenant, replacing `{tenant-id}`:

```
dxp-next auth login --tenant={tenant-id}
```

Update the component version in its `manifest.json` following SemVer, then deploy:

```
npm run deploy --name=component_name
```

After the first deployment, add the component to a set manually. Later deployments increment the version in the set automatically.

To version and deploy several components at once, use the `vermgmt` tool:

```
npm run vermgmt
```

### Debug timing logs

Components can emit phased `[CMP DEBUG]` timing logs. This is disabled by default.

Enable locally by setting `CMP_DEBUG_TIMING="true"` in `.env`, or prefix the command:

```
CMP_DEBUG_TIMING=true FEATURE_EDGE_COMPONENTS=true dxp-next cmp dev-ui -p 3010 <component-name>
```

To enable on a deployed component, declare `CMP_DEBUG_TIMING` in the manifest `environment` array and set it in DXP. See `doc/edge-component-debug-timing-handover.md` for the full guide.

## References

- [Squiz DXP Component Service Documentation](https://docs.squiz.net/component-service/latest/index.html)
- [Squiz DXP Component Library (Sample Components)](https://github.com/squizlabs/dxp-component-library)
- [QGDS Bootstrap 5 library](https://qld-gov-au.github.io/qgds-bootstrap5/?path=/docs/welcome--overview)
