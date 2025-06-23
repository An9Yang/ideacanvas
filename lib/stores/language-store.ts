import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-settings',
    }
  )
); 