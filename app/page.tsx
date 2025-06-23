"use client";

import { FlowCanvas } from '@/components/flow/flow-canvas';
import { PromptInput } from '@/components/prompt/prompt-input';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/hooks/useTranslation';

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      {/* 全屏画布 */}
      <div className="absolute inset-0">
        <FlowCanvas />
      </div>
      
      {/* 悬浮控制面板 */}
      <div className="absolute top-4 left-4 w-[480px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-lg shadow-lg border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('appTitle')}</h1>
          <LanguageSwitcher />
        </div>
        <div className="p-4">
          <PromptInput />
        </div>
      </div>
    </main>
  );
}