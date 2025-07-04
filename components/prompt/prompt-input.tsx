"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/lib/stores/flow-store';
import { useI18nToast } from '@/hooks/use-i18n-toast';
import { useTranslation } from '@/hooks/useTranslation';

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const { generateFlow, isGenerating, generationProgress } = useFlowStore();
  const { t } = useTranslation();
  const toast = useI18nToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      await generateFlow(prompt);
      toast.success('generateSuccess');
    } catch (error) {
      console.error('Failed to generate flow:', error);
      toast.error('generateError');
    }
  };

  return (
    <div className="space-y-4">
      {isGenerating && generationProgress && generationProgress.progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${generationProgress.progress}%` }}
          />
        </div>
      )}
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
            <div className="flex items-center">
              <span className="animate-spin mr-2">⚙</span>
              <div className="text-left">
                <div className="text-sm">{generationProgress?.status || t('generating')}</div>
                {generationProgress && generationProgress.progress > 0 && (
                  <div className="text-xs opacity-70">{generationProgress.progress}%</div>
                )}
              </div>
            </div>
          ) : (
            t('generateButton')
          )}
        </Button>
      </div>
    </div>
  );
}
