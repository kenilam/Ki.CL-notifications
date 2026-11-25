import React, { Suspense } from 'react';

// Libraries
import classNames from 'classnames';

// Components
import { Layout } from 'design/components';

// Widgets
import { ThemeToggle } from 'design/widgets';

const LanguageSelect = React.lazy(async () => {
  const { LanguageSelect } = await import('i18n');

  return { default: LanguageSelect };
});

/**
 * Ki.CL's header has the language switcher and the theme toggle; the stand-in
 * puts them at the top right. Not fixed, so it scrolls away instead of covering the review's
 * sticky bar.
 */
const Header: React.FunctionComponent = () => {
  return (
    <Layout alignItems='center' autoFlow='column' gap='narrow' justifyContent='end'>
      <header
        className={classNames('kicl-padding-block', 'kicl-padding-inline-wide')}
      >
        <Suspense fallback={null}>
          <LanguageSelect />
        </Suspense>
        <ThemeToggle variant='secondary' />
      </header>
    </Layout>
  );
};

export { Header };
