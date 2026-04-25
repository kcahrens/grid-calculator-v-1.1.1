import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// BUILD_FORMAT controls which output to produce:
//   umd  — bundles React in (for <script> tag embedding, zero host deps)
//   es   — externalizes React (for bundler-based host apps)
//   (unset) — standard SPA dev/build (used by npm run dev / build:app)
const format = process.env.BUILD_FORMAT;

// The project uses .js extensions for JSX files (CRA convention). Vite's
// import-analysis plugin fails on JSX in .js files, so we pre-transform them
// with esbuild (using the jsx loader) before any other plugin sees them.
const jsxInJsPlugin = {
  name: 'treat-js-files-as-jsx',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.match(/\/src\/.*\.js$/)) return null;
    return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
  },
};

const sharedConfig = {
  plugins: [jsxInJsPlugin, react()],
  resolve: {
    alias: {
      // xlsx-js-style's dist bundle accesses stream.Readable at init time.
      // Vite 6 makes externalized Node built-ins throw on property access
      // (truthy Proxy), so the package's own || {} guard doesn't save it.
      // A plain stub with the right shape is the minimal fix.
      stream: resolve(__dirname, 'src/stubs/stream.js'),
    },
  },
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
};

const libConfig = {
  ...sharedConfig,
  // Replace process.env.NODE_ENV at build time — library bundles run in the
  // browser where process is undefined (no webpack/CRA polyfill).
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/library.js'),
      name: 'GridCalculator',
      formats: [format],
      fileName: () => `grid-calculator.${format}.js`,
    },
    rollupOptions: {
      external: format === 'es' ? ['react', 'react-dom', 'react/jsx-runtime'] : [],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'React',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
};

export default defineConfig(format ? libConfig : sharedConfig);
