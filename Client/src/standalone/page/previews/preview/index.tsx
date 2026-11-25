import React from 'react';

// Components
import { Notification as Card } from 'design/components';

// Hooks
import { useTranslation } from 'design/hooks';

import { AVATARS, RUNNING } from 'notification/notification/avatars';
import { PREVIEWS } from 'notification/standalone/page/previews/constants';

const Preview: React.FunctionComponent<{ id: string }> = ({ id }) => {
  const { t } = useTranslation('notification');
  const preview = PREVIEWS.find((candidate) => candidate.id === id);

  if (!preview) {
    return null;
  }

  return (
    <Card
      avatar={preview.running ? RUNNING : AVATARS[preview.level]}
      level={preview.level.toLowerCase() as Lowercase<typeof preview.level>}
      title={t('preview_title')}
    >
      {t('preview', { context: id })}
    </Card>
  );
};

export { Preview };
