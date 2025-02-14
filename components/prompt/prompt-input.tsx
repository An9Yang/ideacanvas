"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/lib/stores/flow-store';
import { toast } from 'sonner';

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateFlow } = useFlowStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await generateFlow(prompt);
      toast.success('流程图生成成功');
    } catch (error) {
      console.error('Failed to generate flow:', error);
      toast.error('生成流程图失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="请输入您的需求描述，例如：“我需要一个电商网站”"
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
          清空
        </Button>
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="min-w-[120px]"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">⚙</span>
              生成中...
            </>
          ) : (
            '生成流程图'
          )}
        </Button>
      </div>
    </div>
  );
}
