"use client";

import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { translations } from '@/lib/i18n';

export function useI18nToast() {
  const { t } = useTranslation();
  
  return {
    success: (key: keyof typeof translations.en) => {
      toast.success(t(key));
    },
    error: (key: keyof typeof translations.en) => {
      toast.error(t(key));
    },
    info: (key: keyof typeof translations.en) => {
      toast.info(t(key));
    },
    warning: (key: keyof typeof translations.en) => {
      toast.warning(t(key));
    }
  };
} 