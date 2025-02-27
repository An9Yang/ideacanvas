"use client";

import { useLanguageStore } from '@/lib/stores/language-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  // 获取当前语言文本
  const getCurrentLanguageText = () => {
    return language === 'zh' ? '中文' : 'English';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 flex items-center gap-1">
          <Globe className="h-4 w-4" />
          <span>{getCurrentLanguageText()}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('zh')} className={language === 'zh' ? 'bg-accent' : ''}>
          中文
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 