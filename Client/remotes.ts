import type { ProxyOptions } from 'vite';

/**
 * Where the design system, the languages and the API come from, for the dev proxy and for
 * the type download. Both go through a Ki.CL deployment by default, the same
 * paths Ki.CL serves them on, so the browser only ever talks to localhost.
 */

type Env = Record<string, string | undefined>;

/** Checked by Ki.CL's proxy. Without it the deployment asks for a password. */
const TOKEN_HEADER = 'x-kicl-client-token';

/** The dev deployment: the default host, and where files kept in the buckets come from, so a page runs locally without Google Cloud credentials. */
const DEV_URL = 'https://dev.ki-cl.com';

const getTargets = (env: Env) => {
  const host = env.KICL_HOST_URL || DEV_URL;

  return {
    api: env.KICL_BACKEND_URL || host,
    design: env.KICL_DESIGN_URL || host,
    i18n: env.KICL_I18N_URL || host,
    host,
  };
};

/**
 * Why requests to the Ki.CL deployment will be refused, or null. Without a
 * token they get its password page, which shows up in the browser as a
 * failed remote rather than as a missing token.
 */
const getTokenWarning = (env: Env) => {
  const { api, design, host } = getTargets(env);

  return (api === host || design === host) && !env.KICL_CLIENT_TOKEN
    ? `No KICL_CLIENT_TOKEN in .env, so ${host} will refuse the requests sent there. Add the token you were sent, or set KICL_BACKEND_URL and KICL_DESIGN_URL to services on this machine.`
    : null;
};

const getHeaders = (env: Env): Record<string, string> =>
  env.KICL_CLIENT_TOKEN ? { [TOKEN_HEADER]: env.KICL_CLIENT_TOKEN } : {};

const getProxy = (env: Env): Record<string, ProxyOptions> => {
  const { api, design, i18n } = getTargets(env);
  const headers = getHeaders(env);

  const route = (target: string, extra?: ProxyOptions): ProxyOptions => ({
    changeOrigin: true,
    headers,
    secure: true,
    target,
    ...extra,
  });

  return {
    // The gateway: the session, and the graph over HTTP and WebSocket.
    '/api': route(api, { ws: true }),
    '/design': route(design),
    '/i18n': route(i18n),
    '/assets/': route(DEV_URL),
    '^/experiments/[^/]+/files/': route(DEV_URL),
  };
};

const getTypeUrls = (env: Env) => {
  const { design, i18n } = getTargets(env);

  return {
    design: {
      api: `${design}/design/types.d.ts`,
      zip: `${design}/design/types.zip`,
    },
    i18n: {
      api: `${i18n}/i18n/@mf-types.d.ts`,
      zip: `${i18n}/i18n/@mf-types.zip`,
    },
  };
};

export { getHeaders, getProxy, getTokenWarning, getTypeUrls };
