// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importation manuelle des traductions
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationES from './locales/es/translation.json';
import translationIT from './locales/it/translation.json';
const resources = {
    en: {
        translation: translationEN,
    },
    fr: {
        translation: translationFR,
    },
    es: {
        translation: translationES,
    },
    it: {
        translation: translationIT,
    },
};
i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en', // Langue par défaut
        supportedLngs: ['en', 'fr', 'es','it'], // Langues supportées
        debug: false,
        interpolation: {
            escapeValue: false, // React échappe déjà les valeurs
        },
        backend: {
            loadPath: './src/locales/{{lng}}/translation.json', // Chemin vers les fichiers de traduction
        },
    });

export default i18n;
