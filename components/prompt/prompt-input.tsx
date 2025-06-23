"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/lib/stores/flow-store';
import { useI18nToast } from '@/hooks/use-i18n-toast';
import { useTranslation } from '@/hooks/useTranslation';

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateFlow } = useFlowStore();
  const { t } = useTranslation();
  const toast = useI18nToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await generateFlow(prompt);
      toast.success('generateSuccess');
    } catch (error) {
      console.error('Failed to generate flow:', error);
      toast.error('generateError');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder={t('inputPlaceholder')}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[100px] resize-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline"
          onClick={() => setPrompt('')}
          disabled={isGenerating || !prompt.trim()}
        >
          {t('clearButton')}
        </Button>
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="min-w-[120px]"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">⚙</span>
              {t('generating')}
            </>
          ) : (
            t('generateButton')
          )}
        </Button>
      </div>
    </div>
  );
}
