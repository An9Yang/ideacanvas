"use client";

import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { translations } from '@/lib/i18n';

export function useI18nToast() {
  const { t } = useTranslation();
  
  return {
    success: (key: keyof typeof translations.en) => {
      toast({
        title: t(key),
        variant: 'default',
      });
    },
    error: (key: keyof typeof translations.en) => {
      toast({
        title: t(key),
        variant: 'destructive',
      });
    },
    info: (key: keyof typeof translations.en) => {
      toast({
        title: t(key),
        variant: 'default',
      });
    },
    warning: (key: keyof typeof translations.en) => {
      toast({
        title: t(key),
        variant: 'default',
      });
    }
  };
} 