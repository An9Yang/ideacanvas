'use client';

import React, { useRef, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';

interface CodePreviewProps {
  html: string;
}

export function CodePreview({ html }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { language } = useLanguageStore();

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      
      // 使用 srcdoc 而不是直接访问 contentDocument
      // 这样可以避免跨域问题
      iframe.srcdoc = html;
    }
  }, [html]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {language === 'zh' ? '实时预览' : 'Live Preview'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {language === 'zh' ? '预览可能与实际效果略有差异' : 'Preview may differ slightly from actual result'}
        </div>
      </div>
      
      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          title="Code Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          style={{
            backgroundColor: 'white',
          }}
        />
      </div>
    </div>
  );
}