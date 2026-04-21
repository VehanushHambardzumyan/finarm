import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import hy from "./locales/hy.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

const savedLanguage = localStorage.getItem("lang") || "hy";

i18n.use(initReactI18next).init({
  resources: {
    hy: { translation: hy },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;