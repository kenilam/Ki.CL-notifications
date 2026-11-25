import { useEffect } from 'react';

// API
import { useMutation, useQuery, useSubscription } from '@apollo/client/react';

// Routes
import { useLocation } from 'design/router';

import {
  NotificationsDismissDocument,
  NotificationsDocument,
  NotificationsUpdatedDocument,
} from './documents';

/**
 * The visitor's notifications. The list is read again whenever the page
 * regains focus or the visitor moves to another page, which is how work
 * started elsewhere shows up. A socket stays open only while something is
 * still running. A finished notification for the page the visitor is on is
 * dismissed, since they are looking at the result.
 */
function useNotifications() {
  const { pathname } = useLocation();
  const { data, refetch } = useQuery(NotificationsDocument, { fetchPolicy: 'cache-and-network' });
  const [dismiss] = useMutation(NotificationsDismissDocument, { refetchQueries: [NotificationsDocument] });

  const notifications = (data?.notifications ?? []).filter(({ dismissedAt }) => !dismissedAt);
  const running = notifications.some((notification) => notification.running);

  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  useEffect(() => {
    const read = () => {
      if (document.visibilityState === 'visible') {
        void refetch();
      }
    };

    addEventListener('focus', read);
    document.addEventListener('visibilitychange', read);

    return () => {
      removeEventListener('focus', read);
      document.removeEventListener('visibilitychange', read);
    };
  }, [refetch]);

  useSubscription(NotificationsUpdatedDocument, {
    onData: ({ client, data: { data: pushed } }) => {
      const updated = pushed?.notificationsUpdated;

      if (!updated) {
        return;
      }

      client.cache.updateQuery({ query: NotificationsDocument }, (cached) =>
        !cached || cached.notifications.some(({ id }) => id === updated.id)
          ? cached
          : { notifications: [updated, ...cached.notifications] },
      );
    },
    skip: !running,
  });

  const seen = notifications
    .filter(({ path, running: busy }) => path === pathname && !busy)
    .map(({ id }) => id)
    .join(',');

  useEffect(() => {
    if (!seen) {
      return;
    }

    void dismiss({ variables: { ids: seen.split(',') } });
  }, [dismiss, seen]);

  const shown = notifications.filter(({ path }) => path !== pathname);
  const ended = shown.filter(({ running: busy }) => !busy);

  const clear = (ids: string[]) => {
    void dismiss({ variables: { ids } });
  };

  return { clear, ended, shown };
}

export { useNotifications };
