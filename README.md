# Grid Calculator

A React-based grid layout calculator. Runs as a standalone SPA and ships as an embeddable library bundle.

## Local development

```bash
npm install
npm run start          # dev server at http://localhost:5173
```

## Builds

| Command | Output | Purpose |
| --- | --- | --- |
| `npm run build:app` | `dist/` | SPA build (deployed to GitHub Pages by `npm run deploy`) |
| `npm run build` | `lib/grid-calculator.umd.js` + `lib/grid-calculator.es.js` | Library bundles for embedding |

`dist/` and `lib/` are independent — `build` and `build:app` do not interfere.

## Embedding

The UMD bundle is self-contained (React is bundled in) and exposes `window.GridCalculator`:

```html
<div id="grid-calc"></div>
<script src="https://your-host/grid-calculator.umd.js"></script>
<script>
  GridCalculator.mount(document.getElementById('grid-calc'), {
    syncUrl: false,
  });
</script>
```

### `syncUrl` (default `true`)

When `true`, the component writes its state to `window.location` so a URL captures the current configuration. **Set `syncUrl: false` when embedding into a multi-page host app** — otherwise the component will rewrite the host page's URL on every state change.

### Bundler hosts

The ES bundle externalizes React. Import directly:

```js
import { mount, GridCalculator } from 'grid-calculator/lib/grid-calculator.es.js';
```
