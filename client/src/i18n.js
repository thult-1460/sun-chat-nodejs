import i18n from 'i18next';
import { reactI18nextModule } from 'react-i18next';
import detector from 'i18next-browser-languagedetector';
import backend from 'i18next-xhr-backend';
import systemConfig from './config/configServer';

const listFile = ['auth', 'user', 'contact', 'listRoom', 'member', 'room', 'message', 'task', 'notification', 'emoji', 'liveChat'];

function getFileLang(lang = 'en') {
  let tmp = {};
  for (let i in listFile) {
    tmp[listFile[i]] = require('./locales/' + lang + '/' + listFile[i] + '.json');
  }

  return tmp;
}

const resources = {
  en: getFileLang('en'),
  vi: getFileLang('vi'),
};

i18n
  .use(detector)
  .use(backend)
  .use(reactI18nextModule)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || systemConfig.LOCALE,
    fallbackLng: localStorage.getItem('i18nextLng') || systemConfig.LOCALE,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
