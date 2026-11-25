import React from 'react';

// Libraries
import classNames from 'classnames';

// Components
import { Heading, Layout, Text } from 'design/components';

// Hooks
import { useTranslation } from 'design/hooks';

import { Notification } from 'notification/notification';

import { Demo } from './demo';
import { Previews } from './previews';

const Page: React.FunctionComponent = () => {
  const { t } = useTranslation('notification');

  return (
    <main className={classNames('kicl-max-inline-size-columns-8', 'kicl-margin-inline-auto', 'kicl-padding-inline-wide')}>
      <Layout gap='wide'>
        <Heading is='h1'>{t('title')}</Heading>
        <Text>{t('intro')}</Text>
        <Demo />
        <Previews />
      </Layout>
      <Notification />
    </main>
  );
};

export { Page };
