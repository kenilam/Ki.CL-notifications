import React from 'react';

// API
import { useMutation } from '@apollo/client/react';

// Components
import { Button } from 'design/components';

// Hooks
import { useTranslation } from 'design/hooks';

import { NotificationsDemoDocument } from 'notification/notification/documents';

/** Starts a short pretend job. The page doesn't wait for it: the bell shows each step as it arrives. */
const Demo: React.FunctionComponent = () => {
  const { t } = useTranslation('notification');
  const [start, { loading }] = useMutation(NotificationsDemoDocument);

  return (
    <Button disabled={loading} onClick={() => void start().catch(() => undefined)}>
      {t('action_demo')}
    </Button>
  );
};

export { Demo };
