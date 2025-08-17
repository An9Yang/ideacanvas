'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/language-store';

interface CodeEditorProps {
  code: string;
  language: 'html' | 'css' | 'javascript' | 'json';
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export function CodeEditor({ 
  code, 
  language: codeLang, 
  readOnly = true, 
  onChange 
}: CodeEditorProps) {
  const { language } = useLanguageStore();
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<string>('');

  useEffect(() => {
    const lines = code.split('\n').length;
    const numbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    setLineNumbers(numbers);
  }, [code]);


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersElement = document.getElementById('line-numbers');
    if (lineNumbersElement) {
      lineNumbersElement.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const getLanguageLabel = () => {
    const labels = {
      html: 'HTML',
      css: 'CSS',
      javascript: 'JavaScript',
      json: 'JSON'
    };
    return labels[codeLang] || codeLang.toUpperCase();
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">
          {getLanguageLabel()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              {language === 'zh' ? '已复制' : 'Copied'}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              {language === 'zh' ? '复制' : 'Copy'}
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div 
          id="line-numbers"
          className="px-3 py-4 bg-gray-800 text-gray-500 text-sm font-mono select-none overflow-y-hidden"
          style={{ 
            lineHeight: '1.5rem',
            whiteSpace: 'pre'
          }}
        >
          {lineNumbers}
        </div>
        
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          onScroll={handleScroll}
          className="flex-1 px-4 py-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
          style={{ 
            lineHeight: '1.5rem',
            tabSize: 2
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}