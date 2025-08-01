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
      
      // 清理 HTML 中的多余内容
      let cleanedHtml = html;
      
      // 移除开头的 'html' 文字或其他非 HTML 内容
      if (!cleanedHtml.trim().startsWith('<!DOCTYPE') && !cleanedHtml.trim().startsWith('<html')) {
        const doctypeIndex = cleanedHtml.indexOf('<!DOCTYPE');
        const htmlIndex = cleanedHtml.indexOf('<html');
        const startIndex = doctypeIndex !== -1 ? doctypeIndex : htmlIndex;
        if (startIndex > 0) {
          cleanedHtml = cleanedHtml.substring(startIndex);
        }
      }
      
      // 注入脚本来处理导航
      const navigationScript = `
        <script>
          // 拦截所有链接点击
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href) {
              const href = link.getAttribute('href');
              // 如果是锚点链接，允许默认行为
              if (href && href.startsWith('#')) {
                return;
              }
              // 其他链接阻止默认行为并显示提示
              e.preventDefault();
              console.log('Navigation to:', href);
              // 可以在这里添加提示用户的逻辑
            }
          });
          
          // 确保页面内锚点导航正常工作
          document.addEventListener('DOMContentLoaded', function() {
            const handleHashChange = function() {
              const target = document.querySelector(window.location.hash);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            };
            window.addEventListener('hashchange', handleHashChange);
          });
        </script>
      `;
      
      // 在 </body> 前插入导航处理脚本
      if (cleanedHtml.includes('</body>')) {
        cleanedHtml = cleanedHtml.replace('</body>', navigationScript + '</body>');
      } else {
        cleanedHtml += navigationScript;
      }
      
      // 使用 srcdoc 而不是直接访问 contentDocument
      // 这样可以避免跨域问题
      iframe.srcdoc = cleanedHtml;
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          style={{
            backgroundColor: 'white',
          }}
        />
      </div>
    </div>
  );
}