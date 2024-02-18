import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import enJSON from './locales/en.json';

await i18next.use(initReactI18next).init({
  resources: {
    en: enJSON,
  },
  lng: 'en',
});
