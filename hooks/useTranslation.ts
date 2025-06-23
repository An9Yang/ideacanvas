import { useLanguageStore } from "@/lib/stores/language-store";
import { translations } from "@/lib/i18n";

export function useTranslation() {
  const { language } = useLanguageStore();
  
  const t = (key: keyof typeof translations.en) => {
    return translations[language][key];
  };

  return { t, language };
} 