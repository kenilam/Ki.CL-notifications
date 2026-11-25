import { GraphQLError } from 'graphql';

import { publish } from './publish.js';

const HOUR_MS = 60 * 60 * 1000;
const PER_HOUR = 10;
const STEP_MS = 3000;
const SOURCE = 'demo';
const PATH = '/notification/';

/** This service runs one instance, so the allowance is kept in memory. */
const started = new Map<string, number[]>();
const running = new Set<string>();

const STEPS = [
  { context: 'started', level: 'info', running: true },
  { context: 'halfway', level: 'info', running: true },
  { context: 'done', level: 'confirm', running: false },
] as const;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A short pretend job for the caller. Each step goes out through the same
 * path as real work, so the bell updates in front of them. The request stays
 * open until the job ends, because Cloud Run only runs code while a request
 * is in flight.
 */
export async function demo(owner: string): Promise<void> {
  const now = Date.now();
  const recent = (started.get(owner) ?? []).filter((time) => now - time < HOUR_MS);

  if (running.has(owner) || recent.length >= PER_HOUR) {
    throw new GraphQLError('Too many demos', { extensions: { code: 'TOO_MANY_REQUESTS' } });
  }

  started.set(owner, [...recent, now]);
  running.add(owner);

  try {
    for (const [index, step] of STEPS.entries()) {
      if (index > 0) {
        await wait(STEP_MS);
      }

      await publish({
        owner,
        source: SOURCE,
        at: new Date().toISOString(),
        path: PATH,
        level: step.level,
        running: step.running,
        namespace: 'notification',
        title: { key: 'demo_title', values: {} },
        message: { key: 'demo', values: { context: step.context } },
      });
    }
  } finally {
    running.delete(owner);
  }
}
