import React from 'react';

// API
import { useApolloClient, useMutation } from '@apollo/client/react';

// Components
import { Button } from 'design/components';

// Hooks
import { useTranslation } from 'design/hooks';

import { NotificationsDemoDocument, NotificationsDocument } from 'notification/notification/documents';

/** A page that starts work reads the list again, so the bell sees it running and follows it. */
const RUNNING_MS = 1000;

/** Starts a short pretend job. The page doesn't wait for it: the bell shows each step as it arrives. */
const Demo: React.FunctionComponent = () => {
  const { t } = useTranslation('notification');
  const client = useApolloClient();
  const [start, { loading }] = useMutation(NotificationsDemoDocument, { refetchQueries: [NotificationsDocument] });

  const onClick = () => {
    void start().catch(() => undefined);
    setTimeout(() => void client.refetchQueries({ include: [NotificationsDocument] }), RUNNING_MS);
  };

  return (
    <Button disabled={loading} onClick={onClick}>
      {t('action_demo')}
    </Button>
  );
};

export { Demo };
