import React, { Suspense } from 'react';

// Components
import { NotificationGroup } from 'design/components';

import { Item } from './item';
import { useNotifications } from './use-notifications';

/**
 * The bell. A consumer places it once, inside its Apollo provider and
 * router. It opens once something has finished, and closing it dismisses
 * every finished notification.
 */
const Notification: React.FunctionComponent = () => {
  const { clear, ended, shown } = useNotifications();

  if (!ended.length) {
    return null;
  }

  return (
    <NotificationGroup
      defaultOpen
      side='block-start'
      onOpenChange={(open) => (open ? undefined : clear(ended.map(({ id }) => id)))}
    >
      {shown.map(({ id }) => (
        // Each sender's words load on their own, so one slow namespace holds up only its notification.
        <Suspense fallback={null} key={id}>
          <Item id={id} />
        </Suspense>
      ))}
    </NotificationGroup>
  );
};

export { Notification };
