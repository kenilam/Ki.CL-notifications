import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import notification from 'notification/locales/en-US/notification.json';

i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  document.documentElement.dir = i18next.dir(language);
});

/**
 * Inside Ki.CL the host sets up i18next. Run on its own, this page sets it up
 * the same way: Ki.CL-i18n's backend reads the words in the visitor's
 * language, and the bundled English is the fallback.
 */
const ready = import('i18n').then(async ({ backend, loadTranslations, rememberedLanguage }) => {
  let lng = 'en-US';

  try {
    const { contentLanguage } = await loadTranslations(rememberedLanguage() || navigator.language, ['notification']);

    lng = contentLanguage.split(',')[0]?.trim() || lng;
  } catch (error) {
    console.error(error);
  }

  return i18next
    .use(backend)
    .use(initReactI18next)
    .init({
      backend: {
        fallback: async (_language: string, namespace: string) => (namespace === 'notification' ? notification : undefined),
      },
      defaultNS: 'notification',
      fallbackLng: false,
      interpolation: { escapeValue: false },
      load: 'currentOnly',
      lng,
      ns: ['notification'],
    });
});

export { ready };
