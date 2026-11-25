import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import { useServer } from 'graphql-ws/use/ws';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';

import { apply, forget, isForget, isNotice } from './notices.js';
import { precompressed } from './precompressed.js';
import { schema, type Context } from './schema.js';
import { ownerOf } from './visitor.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  process.loadEnvFile(path.join(root, '.env'));
} catch {
  // Cloud Run sets the environment itself.
}

const PORT = Number(process.env.NOTIFICATIONS_SERVER_PORT || process.env.PORT) || 3401;
const DIST = path.join(root, 'Client/dist');

const app = express();
const httpServer = createServer(app);
const sockets = new WebSocketServer({ server: httpServer, path: '/api' });
const cleanup = useServer<Record<string, unknown>>(
  {
    schema,
    context: (context): Context => ({
      owner: ownerOf(
        context.extra.request.headers.cookie ??
          (typeof context.connectionParams?.cookie === 'string' ? context.connectionParams.cookie : undefined),
      ),
    }),
  },
  sockets,
);

const server = new ApolloServer<Context>({
  schema,
  introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    { serverWillStart: async () => ({ drainServer: async () => { await cleanup.dispose(); } }) },
  ],
});

async function start() {
  await mongoose.connect(process.env.MONGODB_ATLAS_URI ?? '', {
    dbName: process.env.MONGODB_DATABASE || 'test',
    retryWrites: true,
    w: 'majority',
  });
  await server.start();

  app.get('/health', (_request, response) => {
    response.json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' });
  });

  // Pub/Sub pushes each notice here. Any answer but 2xx makes it retry, so a notice that can never apply is acknowledged and logged.
  app.post('/internal/notices', express.json(), async (request, response) => {
    const data = request.body?.message?.data;
    let notice: unknown;

    try {
      notice = JSON.parse(Buffer.from(String(data), 'base64').toString('utf8'));
    } catch {
      notice = undefined;
    }

    if (isForget(notice)) {
      await forget(notice);
      response.status(204).end();
      return;
    }

    if (!isNotice(notice)) {
      console.warn('[Notices] dropped a notice it could not read');
      response.status(204).end();
      return;
    }

    await apply(notice);
    response.status(204).end();
  });

  app.use(
    '/api',
    express.json({ limit: '1mb' }),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => ({ owner: ownerOf(req.headers.cookie) }),
    }),
  );

  app.get('/notification/@mf-types.zip', (_request, response) => {
    response.sendFile(path.join(DIST, '@mf-types.zip'));
  });

  app.use(
    '/notification',
    precompressed(DIST),
    express.static(DIST, {
      setHeaders(response, file) {
        response.setHeader('Cache-Control', file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );

  httpServer.listen(PORT, () => {
    console.log(`Notifications on ${PORT}`);
  });
}

void start();
