# Handover: edge component debug timing logs

Instructions for adding phased `[CMP DEBUG]` timing logs to a **boilerplate edge component** (or any Squiz DXP edge component). Use this when investigating slow worker returns, suspected memory pressure, or idle time between component execution and HTTP response.

This pattern was introduced on the VUW `remove-cache` branch while profiling `study-options-key-details-nocache`. The same approach can be copied into a boilerplate repo so every new edge component starts with a consistent diagnostic hook.

---

## What you are adding

A tiny in-function timer that emits `console.debug` lines at meaningful phases inside `main()`. Each line records:

1. **What happened** (a short action label)
2. **When it happened** (milliseconds since `main()` started)

Example output:

```
[CMP DEBUG] main started (+0ms)
[CMP DEBUG] config ready audience=domestic qualCode=BCOM importantDatesFolder=5843 (+0ms)
[CMP DEBUG] starting parallel metadata and countries fetch (+1ms)
[CMP DEBUG] parallel metadata and countries fetch complete countriesStatus=ok (+312ms)
[CMP DEBUG] starting qualification API fetch code=BCOM (+312ms)
[CMP DEBUG] qualification API fetch complete status=ok (+401ms)
[CMP DEBUG] HTML markup render complete length=78843 (+441ms)
[CMP DEBUG] main complete (+441ms)
```

**Important:** `+Nms` is **cumulative from `main started`**, not the duration of that step alone. To get step duration, subtract the previous line’s `+Nms` from the current line’s `+Nms`.

---

## Reference implementations (this repo)

| Component | Path | Role |
|-----------|------|------|
| Full example | `dxp/components/subjects-quals/study-options-key-details-nocache/main.js` | Production-like component with logs at every async/sync phase |
| Minimal example | `dxp/components/subjects-quals/study-options-key-details-static-html/main.js` | Static HTML only — API-free baseline (~0ms) |
| Investigation notes | `dxp/components/subjects-quals/study-options-key-details-simplified/PERFORMANCE.md` | Broader performance context (XSS, API, memory) |

On the boilerplate repo, mirror the **minimal example** in the template component and document the **full pattern** in README or this handover doc.

---

## Step 1 — Add the helper at the top of `main()`

In `main.js`, as the **first lines** inside `main()` (before any `await` or heavy work):

```javascript
const debugStart = Date.now();
const debugMark = (action) => console.debug(`[CMP DEBUG] ${action} (+${Date.now() - debugStart}ms)`);

debugMark('main started');
```

### Conventions

| Rule | Detail |
|------|--------|
| Log level | Use `console.debug`, not `console.log` |
| Prefix | Always `[CMP DEBUG]` (grep-friendly in Dynatrace / CF logs) |
| Action text | Short verb phrase: `starting …`, `… complete`, `… failed` |
| Context | Append safe, non-sensitive key=value pairs when useful (`code=BCOM`, `count=254`, `status=ok`) |
| Sensitive data | Do **not** log tokens, cookies, PII, or full API payloads |

### Optional: shared util (recommended for boilerplate)

If the boilerplate repo has `utils/`, extract the helper once:

```javascript
// utils/component-debug.js
export function createComponentDebugMark(componentName = 'component') {
    const debugStart = Date.now();
    const prefix = `[CMP DEBUG]${componentName ? ` ${componentName}` : ''}`;

    return (action) => console.debug(`${prefix} ${action} (+${Date.now() - debugStart}ms)`);
}
```

Usage in `main.js`:

```javascript
import {createComponentDebugMark} from '../../utils/component-debug.js';

export default {
    async main(data, componentUtilities) {
        const debugMark = createComponentDebugMark('my-component');
        debugMark('main started');
        // ...
    },
};
```

Keep the prefix grep-friendly. Either `[CMP DEBUG]` alone or `[CMP DEBUG] my-component` is fine; stay consistent across the repo.

---

## Step 2 — Place marks at phase boundaries

Add `debugMark(...)` at boundaries where time is likely spent or where you need visibility.

### Minimum set (boilerplate template)

Every edge component template should have at least:

```javascript
debugMark('main started');
// ... all work ...
debugMark('main complete');
```

### Recommended set (components with async I/O)

| Phase | When to log | Example |
|-------|-------------|---------|
| Config parsed | After reading manifest input / `componentUtilities` | `config ready audience=domestic` |
| Before `await` | Immediately before each external call or `Promise.all` | `starting countries fetch` |
| After `await` | Immediately after resolution (success or failure) | `countries fetch complete status=ok` |
| CPU-heavy sync work | Before/after mapping, sorting, large string build | `starting HTML markup render` |
| Return | After markup built, before `return` | `HTML markup render complete length=12345` |
| Exit | Last line before `return` | `main complete` |

### Async pattern

```javascript
debugMark('starting example API fetch');
let response;
try {
    response = await fetchExampleData(code);
    debugMark(`example API fetch complete status=${response?.status || 'unknown'}`);
} catch (error) {
    debugMark(`example API fetch failed error=${error?.message || 'unknown'}`);
    throw error;
}
```

### Parallel fetches

```javascript
debugMark('starting parallel metadata and countries fetch');
const [metadata, countries] = await Promise.all([resolveMetadata(), fetchCountries()]);
debugMark(`parallel metadata and countries fetch complete countriesStatus=${countries?.status || 'unknown'}`);
```

One pair of marks around `Promise.all` is enough; avoid logging inside each promise unless you need per-call breakdown.

### HTML render

Build markup into a variable so you can log output size:

```javascript
debugMark('starting HTML markup render');
const markup = html`...`;
debugMark(`HTML markup render complete length=${markup?.length ?? 0}`);
debugMark('main complete');
return markup;
```

Markup length helps spot unexpectedly large responses (memory / serialisation cost).

---

## Step 3 — Add a static HTML baseline (optional but valuable)

For performance A/B testing, add a second boilerplate variant (or a flag-driven branch) that returns **hardcoded HTML** with no API calls:

- Same CSS classes and DOM shape as the real component
- `main()` only returns a `STATIC_MARKUP` string
- Same `debugMark` calls (should complete in ~0–1ms)

Reference: `study-options-key-details-static-html/main.js`.

Compare logs:

| Component | Typical `main complete` time | Implies |
|-----------|------------------------------|---------|
| Static HTML | ~0ms | Worker/platform overhead only |
| Full component | Hundreds of ms+ | Cost is in APIs, mapping, or sanitisation |

---

## Step 4 — Local development

### Prerequisites

From the repo root:

```bash
npm install
dxp-next auth login   # if not already authenticated
```

### Run the component dev UI

```bash
cd dxp/components/<bundle>
FEATURE_EDGE_COMPONENTS=true dxp-next cmp dev-ui -p 3010 <component-name>
```

Open `http://localhost:3010` and trigger a render. Debug lines appear in the terminal running `dev-ui` (esbuild / local component runtime).

### Ports (VUW repo)

| Port | Purpose |
|------|---------|
| 3010 | Component dev UI (`-p` flag; adjustable) |
| 5555 | Edge render API (hardcoded by `dxp-next cmp dev-ui`) |
| 4000 | Vite frontend (`npm run dev`) |

### Deployed / staging

After deploy, find logs in your platform tooling (e.g. Dynatrace, Cloudflare Workers logs). Filter on `[CMP DEBUG]`.

---

## Step 5 — How to interpret results

### Large gap between consecutive logs

Subtract timestamps:

```
parallel fetch complete (+120ms)
qualification API complete (+400ms)   → ~280ms in qualification API
```

### Same `+Nms` on consecutive lines

`Date.now()` has 1ms resolution. Two lines both at `+441ms` means the work between them took **less than 1ms** (e.g. HTML string assembly).

### Long gap after `main complete`

If the worker still appears idle before the HTTP response returns, time is likely **outside** `main()` — isolate lifecycle, response flush, platform serialisation, or GC. Compare against the static HTML component to confirm.

### Common hotspots (from VUW investigation)

1. External API fetches (qualification API, countries, Matrix metadata)
2. Full XSS sanitisation on many strings (see `study-options-key-details-simplified/PERFORMANCE.md`)
3. Large HTML output (country `<option>` lists, many date rows)

Debug logs narrow **which phase**; they do not replace heap profiling for memory leaks.

---

## Step 6 — Boilerplate repo checklist

Hand this checklist to the developer implementing the boilerplate change:

- [ ] `main.js` template includes `debugStart` / `debugMark` at top of `main()`
- [ ] At least `main started` and `main complete` marks exist
- [ ] Template documents where to add marks around `await` calls
- [ ] Log format matches: `` `[CMP DEBUG] <action> (+<ms>ms)` ``
- [ ] No secrets or PII in log messages
- [ ] Optional: `utils/component-debug.js` shared helper
- [ ] Optional: `example-static` component with no API calls for baseline timing
- [ ] README section: “Debug timing logs” linking to this doc
- [ ] Example log output pasted in README or component README

### Suggested README snippet (copy into boilerplate)

```markdown
## Debug timing logs

Edge components include `[CMP DEBUG]` logs to trace render phases. Search logs for `[CMP DEBUG]`.

- `+Nms` = milliseconds since `main()` started (cumulative, not per-step).
- Add marks before/after every `await` and before returning HTML.
- See `docs/edge-component-debug-timing-handover.md` for full instructions.
```

---

## Step 7 — Production policy

Decide explicitly for the boilerplate repo:

| Approach | When |
|----------|------|
| **Always on** | Acceptable if volume is low and logs are `debug` level; easy for staging diagnosis |
| **Env-gated** | Wrap helper: only log when `componentUtilities?.ctx?.debug === true` or an env var is set |
| **Strip before prod** | Remove marks before merging to production branch (not ideal — you lose staging signal) |

VUW currently logs unconditionally in diagnostic components (`-nocache`, `-static-html`). For a generic boilerplate, **env-gating** is a reasonable default:

```javascript
const debugEnabled = componentUtilities?.ctx?.editor === true
    || process.env.CMP_DEBUG_TIMING === 'true';

const debugMark = debugEnabled
    ? (action) => console.debug(`[CMP DEBUG] ${action} (+${Date.now() - debugStart}ms)`)
    : () => {};
```

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Logging inside tight loops (per country, per date row) | Log noise; cost can affect the measurement |
| `console.log` for timing | Harder to filter; may appear in prod log pipelines |
| Logging full HTML or API JSON | Size, noise, possible data leakage |
| Per-step timers everywhere | Start with phase boundaries; add granularity only when needed |

---

## Acceptance criteria

The boilerplate work is done when:

1. A new edge component created from the template emits `[CMP DEBUG] main started` and `main complete` on first render.
2. Another developer can follow this doc without reading the VUW profiling branch history.
3. Log interpretation (cumulative `+Nms`) is documented in the boilerplate README.
4. (Optional) Static baseline component renders with all marks at ~0ms locally.

---

## Related reading

- `docs/pattern-dxp-tooltip.md` — example of a focused pattern doc in this repo
- `dxp/components/subjects-quals/study-options-key-details-simplified/PERFORMANCE.md` — XSS, API, and memory investigation
- `.codex/skills/dxp-components/SKILL.md` — edge component file layout and `main.js` conventions
