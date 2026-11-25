import { PubSub } from 'graphql-subscriptions';

import { KEEP_MS, LEVELS, Notifications, type Level, type Notification, type Text } from './model.js';

/**
 * A step of some work, sent by the service doing it. With an `owner` it is
 * that visitor's row for `source`. Without one it goes to everyone already
 * watching `source`, so the sender never needs to know who they are.
 */
export interface Notice {
  owner?: string;
  source: string;
  /** When the step happened. A notice older than the stored one is ignored, so a late or repeated one never goes backwards. */
  at: string;
  path: string;
  level: Level;
  running: boolean;
  namespace: string;
  title: Text;
  message: Text;
}

/** Sent when an account is deleted: every notification it owns goes. */
export interface Forget {
  owner: string;
  forget: true;
}

export const isForget = (value: unknown): value is Forget =>
  typeof value === 'object' &&
  value !== null &&
  (value as Forget).forget === true &&
  typeof (value as Forget).owner === 'string';

export async function forget({ owner }: Forget): Promise<void> {
  await Notifications.deleteMany({ ownerGUID: owner });
}

export const updates = new PubSub<{ UPDATED: { notificationsUpdated: Notification } }>();

const isText = (value: unknown): value is Text =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Text).key === 'string' &&
  typeof ((value as Text).values ?? {}) === 'object';

export function isNotice(value: unknown): value is Notice {
  const notice = value as Notice;

  return (
    typeof value === 'object' &&
    value !== null &&
    (notice.owner === undefined || typeof notice.owner === 'string') &&
    typeof notice.source === 'string' &&
    !Number.isNaN(Date.parse(notice.at)) &&
    typeof notice.path === 'string' &&
    LEVELS.includes(notice.level) &&
    typeof notice.running === 'boolean' &&
    typeof notice.namespace === 'string' &&
    isText(notice.title) &&
    isText(notice.message)
  );
}

const isDuplicate = (error: unknown) => (error as { code?: number }).code === 11000;

export async function apply(notice: Notice): Promise<void> {
  const at = new Date(notice.at);
  const older = { $or: [{ at: { $lt: at } }, { at: { $exists: false } }] };
  const fields = {
    at,
    path: notice.path,
    level: notice.level,
    running: notice.running,
    namespace: notice.namespace,
    title: { key: notice.title.key, values: notice.title.values ?? {} },
    message: { key: notice.message.key, values: notice.message.values ?? {} },
    dismissedAt: null,
    expiresAt: new Date(Date.now() + KEEP_MS),
  };

  if (notice.owner) {
    try {
      const written = await Notifications.findOneAndUpdate(
        { ownerGUID: notice.owner, source: notice.source, ...older },
        { $set: fields },
        { returnDocument: 'after', upsert: true },
      ).lean<Notification>();

      if (written) {
        void updates.publish('UPDATED', { notificationsUpdated: written });
      }
    } catch (error) {
      // The row is newer than this notice, so the upsert tried a second row for the same owner and source.
      if (!isDuplicate(error)) {
        throw error;
      }
    }

    return;
  }

  const watching = await Notifications.find({ source: notice.source, ...older }, { _id: 1 }).lean();
  const ids = watching.map(({ _id }) => _id);

  if (!ids.length) {
    return;
  }

  await Notifications.updateMany({ _id: { $in: ids }, ...older }, { $set: fields });

  for (const written of await Notifications.find({ _id: { $in: ids } }).lean<Notification[]>()) {
    void updates.publish('UPDATED', { notificationsUpdated: written });
  }
}
