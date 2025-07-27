import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import traslationAR from "./translation/ar.json"
import traslationEN from "./translation/en.json"
import LanguageDetector from "i18next-browser-languagedetector"
const resources = {
  ar: {
    translation: traslationAR
  },
  en: {
    translation: traslationEN
  }
};
i18n
.use(LanguageDetector)
  .use(initReactI18next) 
  .init({
    resources,
    lng: "ar",
    interpolation: {
      escapeValue: false 
    },
    react:{
        useSuspense:false
    }
  });
  export default i18n;