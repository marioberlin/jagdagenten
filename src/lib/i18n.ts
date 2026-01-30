import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de_cockpit from '../locales/de/cockpit.json';
import de_scout from '../locales/de/scout.json';
import de_journal from '../locales/de/journal.json';
import de_bureaucracy from '../locales/de/bureaucracy.json';
import de_gear from '../locales/de/gear.json';
import de_pack from '../locales/de/pack.json';
import de_feed from '../locales/de/feed.json';
import de_common from '../locales/de/common.json';
import en_cockpit from '../locales/en/cockpit.json';
import en_scout from '../locales/en/scout.json';
import en_journal from '../locales/en/journal.json';
import en_bureaucracy from '../locales/en/bureaucracy.json';
import en_gear from '../locales/en/gear.json';
import en_pack from '../locales/en/pack.json';
import en_feed from '../locales/en/feed.json';
import en_common from '../locales/en/common.json';

i18n.use(initReactI18next).init({
  resources: {
    de: {
      cockpit: de_cockpit,
      scout: de_scout,
      journal: de_journal,
      bureaucracy: de_bureaucracy,
      gear: de_gear,
      pack: de_pack,
      feed: de_feed,
      common: de_common,
    },
    en: {
      cockpit: en_cockpit,
      scout: en_scout,
      journal: en_journal,
      bureaucracy: en_bureaucracy,
      gear: en_gear,
      pack: en_pack,
      feed: en_feed,
      common: en_common,
    },
  },
  lng: 'de',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
