import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

// Core
import 'design/core';

// Icons
import { Masks } from 'design/icons';

// App
import { Standalone } from './app';

// Translations
import { ready } from './i18n';

/*
 * Only mounts. Kept free of components so a hot update never re-runs it:
 * running it again would call createRoot on the same element twice.
 */
const mount = async () => {
  const appRoot = document.querySelector('app-root');

  // The shell's own pages read their words too, so nothing renders before them.
  await ready;

  if (appRoot) {
    ReactDOM.createRoot(appRoot).render(
      <StrictMode>
        {/* The icons that components draw as CSS masks, such as a select option's check, as Ki.CL's root has them. */}
        <Masks />
        <Standalone />
      </StrictMode>
    );
  }
};

void mount();
