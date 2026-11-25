import 'i18next';

import type notification from 'notification/locales/en-US/notification.json';

/**
 * Keys are checked against the English file, which seeds the database. Kept
 * outside `src`, so it stays out of the types Ki.CL downloads: Ki.CL declares
 * its own namespaces, and two declarations of `resources` would collide.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'notification';
    resources: {
      notification: typeof notification;
    };
  }
}
