import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import notification from 'notification/locales/en-US/notification.json';

/**
 * Inside Ki.CL the host creates i18next and reads the `notification`
 * namespace from the database. Run on its own, this page has only the
 * bundled English.
 */
const ready = i18next.use(initReactI18next).init({
  defaultNS: 'notification',
  fallbackLng: false,
  interpolation: { escapeValue: false },
  lng: 'en-US',
  ns: ['notification'],
  resources: { 'en-US': { notification } },
});

export { ready };
