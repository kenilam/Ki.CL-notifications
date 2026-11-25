import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { compression } from 'vite-plugin-compression2';

import { getProxy, getTokenWarning } from './remotes';

const root = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(root, '..');

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, envDir, '');

  const warning = command === 'serve' ? getTokenWarning(env) : null;

  if (warning) {
    console.warn(`\n⚠ ${warning}\n`);
  }

  return {
    // Ki.CL proxies `/notification` to this remote, built or dev, so every module sits under it.
    base: '/notification/',
    envDir,
    // Only the Turnstile site key reaches the browser; the rest stays server-side.
    envPrefix: ['TURNSTILE_SITE_KEY'],
    plugins: [
      // A .gz and a .br beside each built file, which the server sends as they are.
      compression({ algorithms: ['gzip', 'brotliCompress'] }),
      react(),
      federation({
        name: 'notification',
        moduleParseIdleTimeout: 60,
        filename: 'remoteEntry.js',
        // The views' CSS ships with the remote, so Ki.CL gets it too.
        bundleAllCSS: true,
        // A consumer places the whole bell: `import { Notification } from 'notification'`.
        exposes: {
          '.': './src/index.ts',
        },
        // The same paths Ki.CL loads them from, so one build works in both.
        remotes: {
          design: {
            type: 'module',
            name: 'design',
            entry: '/design/remoteEntry.js',
          },
          // Only the standalone page loads it; inside Ki.CL the host has set up i18next already.
          i18n: {
            type: 'module',
            name: 'i18n',
            entry: '/i18n/remoteEntry.js',
          },
        },
        // The singletons Ki.CL shares that this module uses, at Ki.CL's versions.
        shared: {
          react: { singleton: true, requiredVersion: '^19.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
          'react-router-dom': { singleton: true, requiredVersion: '^7.0.0' },
          // The bell runs its queries through the consumer's client.
          '@apollo/client': { singleton: true, requiredVersion: '^4.0.0' },
          // Ki.CL's instance holds the translations, read from the database.
          i18next: { singleton: true, requiredVersion: '^26.0.0' },
          'react-i18next': { singleton: true, requiredVersion: '^17.0.0' },
        },
        dts: {
          // `scripts/types.ts` downloads them, with the client token.
          consumeTypes: false,
          generateTypes: { compileInChildProcess: true },
        },
        dev: {
          disableDynamicRemoteTypeHints: true,
        },
      }),
    ],
    resolve: {
      // The remote's own name, so the types Ki.CL downloads keep paths it can resolve.
      alias: [{ find: /^notification\//, replacement: `${path.resolve(root, 'src')}/` }],
    },
    server: {
      port: Number(env.PORT) || 3400,
      proxy: getProxy(env),
      strictPort: true,
    },
    build: {
      modulePreload: false,
      outDir: 'dist',
      target: 'esnext',
    },
  };
});
