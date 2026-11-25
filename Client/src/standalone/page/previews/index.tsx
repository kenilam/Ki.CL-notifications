import React from 'react';

// Components
import { Heading, Layout } from 'design/components';

// Hooks
import { useTranslation } from 'design/hooks';

import { PREVIEWS } from './constants';
import { Preview } from './preview';

const Previews: React.FunctionComponent = () => {
  const { t } = useTranslation('notification');

  return (
    <Layout gap='narrow'>
      <section>
        <Heading is='h2' lookLike='h4'>
          {t('preview')}
        </Heading>
        {PREVIEWS.map(({ id }) => (
          <Preview id={id} key={id} />
        ))}
      </section>
    </Layout>
  );
};

export { Previews };
