import React from 'react';

// API
import { useMutation, useQuery } from '@apollo/client/react';

// Components
import { Notification as Card } from 'design/components';

// Hooks
import { useTranslation } from 'design/hooks';

import { AVATARS, RUNNING } from 'notification/notification/avatars';
import { NotificationsDismissDocument, NotificationsDocument } from 'notification/notification/documents';

/** One notification, in the words of the service that sent it. */
const Item: React.FunctionComponent<{ id: string }> = ({ id }) => {
  const { data } = useQuery(NotificationsDocument);
  const [dismiss] = useMutation(NotificationsDismissDocument, { refetchQueries: [NotificationsDocument] });
  const notification = data?.notifications.find((candidate) => candidate.id === id);
  const { t } = useTranslation(notification?.namespace as 'notification');
  // The keys are the sender's, from a namespace this remote doesn't know the types of.
  const say = t as unknown as (key: string, values: Record<string, unknown>) => string;

  if (!notification) {
    return null;
  }

  const { level, message, path, running, title } = notification;

  return (
    <Card
      avatar={running ? RUNNING : AVATARS[level]}
      level={level.toLowerCase() as Lowercase<typeof level>}
      onClear={running ? undefined : () => void dismiss({ variables: { ids: [id] } })}
      title={say(title.key, title.values)}
      to={path}
    >
      {say(message.key, message.values)}
    </Card>
  );
};

export { Item };
