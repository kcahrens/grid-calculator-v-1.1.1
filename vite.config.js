import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
  // GitHub Pages serves the SPA from /grid-calculator-v-1.1.1/, so asset URLs
  // must be prefixed accordingly. Library builds set their own output paths
  // and ignore this.
  base: '/grid-calculator-v-1.1.1/',
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

// Library build modes (output to lib/, separate from the SPA's dist/):
//   lib-umd — bundles React in (for <script> tag embedding, zero host deps).
//             Runs first; clears lib/.
//   lib-es  — externalizes React (for bundler-based host apps).
//             Runs second; preserves the umd output already in lib/.
// Order is enforced by the npm `build` script's `&&` chain.
const libModes = {
  'lib-umd': { format: 'umd', external: [], emptyOutDir: true },
  'lib-es': {
    format: 'es',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    emptyOutDir: false,
  },
};

export default defineConfig(({ mode }) => {
  const lib = libModes[mode];
  if (!lib) return sharedConfig;

  return {
    ...sharedConfig,
    // Replace process.env.NODE_ENV at build time — library bundles run in the
    // browser where process is undefined (no webpack/CRA polyfill).
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    // public/ is for the SPA only; library consumers shouldn't get favicon.ico.
    publicDir: false,
    build: {
      lib: {
        entry: resolve(__dirname, 'src/library.js'),
        name: 'GridCalculator',
        formats: [lib.format],
        fileName: () => `grid-calculator.${lib.format}.js`,
      },
      rollupOptions: {
        external: lib.external,
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
      outDir: 'lib',
      emptyOutDir: lib.emptyOutDir,
    },
  };
});
