import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// BUILD_FORMAT controls which output to produce:
//   umd  — bundles React in (for <script> tag embedding, zero host deps)
//   es   — externalizes React (for bundler-based host apps)
//   app  — standard SPA build (default; used by npm run build:app)
const format = process.env.BUILD_FORMAT;

const libConfig = {
  plugins: [react()],
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

const appConfig = {
  plugins: [react()],
};

export default defineConfig(format ? libConfig : appConfig);
