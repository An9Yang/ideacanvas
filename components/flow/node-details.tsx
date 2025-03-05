"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';
import { NodeType } from '@/lib/types/flow';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { getNodeTypeText } from '@/lib/utils/translate-node';
import { Callout } from '@/components/ui/callout';

interface NodeDetailsProps {
  title: string;
  content: string;
  type: NodeType;
  onClose: () => void;
}

const getTypeStyle = (type: NodeType) => {
  switch (type) {
    case 'external':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    case 'context':
      return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
    case 'guide':
      return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300';
    default:
      return 'bg-background text-foreground';
  }
};

export const NodeDetails = ({ title, content, type, onClose }: NodeDetailsProps) => {
  const { t, language } = useTranslation();
  const typeText = getNodeTypeText(type, language);
  const typeStyle = getTypeStyle(type);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const isMountedRef = useRef(true); // 跟踪组件是否挂载的引用
  const timerRef = useRef<NodeJS.Timeout | null>(null); // 存储定时器引用

  // 组件挂载和卸载时的处理
  useEffect(() => {
    isMountedRef.current = true;
    
    // 组件卸载时的清理
    return () => {
      isMountedRef.current = false;
      // 清除所有可能的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // 使用同步方法复制内容，避免不必要的异步操作
  const handleCopy = () => {
    try {
      // 同步方法复制文本，减少异步操作的问题
      const textArea = document.createElement('textarea');
      textArea.value = content;
      // 防止滚动到底部
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful && isMountedRef.current) {
        setCopied(true);
        
        // 使用toast前检查组件是否还在挂载状态
        if (isMountedRef.current) {
          toast({
            title: t('copySuccess'),
            description: t('copySuccessDescription'),
            duration: 2000,
          });
        }
        
        // 清除之前的定时器
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // 存储新的定时器引用
        timerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setCopied(false);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
      // 确保只在组件挂载时显示错误消息
      if (isMountedRef.current) {
        toast({
          title: t('copyFailed'),
          description: t('copyFailedDescription'),
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  };

  const formatContent = useCallback((content: string) => {
    // 预处理内容，移除JSON格式的大括号和引号
    let processedContent = content;
    
    // 检测内容是否被包裹在大括号中，如果是，尝试解析并提取内容
    if (processedContent.trim().startsWith('{') && processedContent.trim().endsWith('}')) {
      try {
        // 尝试解析JSON
        const jsonObj = JSON.parse(processedContent);
        // 如果解析成功，提取所有值并合并成文本
        let extractedContent = '';
        const extractValues = (obj: any) => {
          if (typeof obj === 'string') {
            extractedContent += obj + '\n\n';
          } else if (Array.isArray(obj)) {
            obj.forEach(item => extractValues(item));
          } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(value => extractValues(value));
          }
        };
        extractValues(jsonObj);
        processedContent = extractedContent.trim();
      } catch (e) {
        // 如果解析失败，保持原样
        console.warn('JSON解析失败，保持原始内容');
      }
    }
    
    // 处理内容，将其分割成段落并标记格式
    const formattedContent: Array<{
      type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list-item' | 'section';
      content: string;
      title?: string;
      items?: Array<{type: string, content: string}>;
    }> = [];

    const lines = processedContent.split('\n');
    let currentSection: {
      type: 'section';
      title: string;
      content: string;
      items: Array<{type: string, content: string}>;
    } | null = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 跳过空行
      if (!trimmedLine) return;
      
      // 处理Markdown风格的标题 - 作为新的section开始
      if (trimmedLine.startsWith('# ')) {
        // 如果有正在处理的section，先保存它
        if (currentSection && currentSection.items.length > 0) {
          formattedContent.push(currentSection);
        }
        
        // 创建新的section
        currentSection = {
          type: 'section',
          title: trimmedLine.substring(2),
          content: '',
          items: []
        };
        
        // 同时添加标题到格式化内容中
        formattedContent.push({
          type: 'h1',
          content: trimmedLine.substring(2)
        });
      } else if (trimmedLine.startsWith('## ')) {
        // 如果有正在处理的section，先保存它
        if (currentSection && currentSection.items.length > 0) {
          formattedContent.push(currentSection);
        }
        
        // 创建新的section
        currentSection = {
          type: 'section',
          title: trimmedLine.substring(3),
          content: '',
          items: []
        };
        
        // 同时添加标题到格式化内容中
        formattedContent.push({
          type: 'h2',
          content: trimmedLine.substring(3)
        });
      } else if (trimmedLine.startsWith('### ')) {
        // 如果有正在处理的section，先保存它
        if (currentSection && currentSection.items.length > 0) {
          formattedContent.push(currentSection);
        }
        
        // 创建新的section
        currentSection = {
          type: 'section',
          title: trimmedLine.substring(4),
          content: '',
          items: []
        };
        
        // 同时添加标题到格式化内容中
        formattedContent.push({
          type: 'h3',
          content: trimmedLine.substring(4)
        });
      } 
      // 处理数字编号 - 作为新的section开始
      else if (/^\d+\.\s/.test(trimmedLine)) {
        // 如果有正在处理的section，先保存它
        if (currentSection && currentSection.items.length > 0) {
          formattedContent.push(currentSection);
        }
        
        // 创建新的section
        currentSection = {
          type: 'section',
          title: trimmedLine,
          content: '',
          items: []
        };
        
        // 同时添加标题到格式化内容中
        formattedContent.push({
          type: 'h2',
          content: trimmedLine
        });
      }
      // 处理字母编号 - 作为新的section开始
      else if (/^[a-z]\)\s/i.test(trimmedLine)) {
        // 如果有正在处理的section，先保存它
        if (currentSection && currentSection.items.length > 0) {
          formattedContent.push(currentSection);
        }
        
        // 创建新的section
        currentSection = {
          type: 'section',
          title: trimmedLine,
          content: '',
          items: []
        };
        
        // 同时添加标题到格式化内容中
        formattedContent.push({
          type: 'h3',
          content: trimmedLine
        });
      }
      // 处理列表项
      else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        // 如果有当前section，将列表项添加到其中
        if (currentSection) {
          currentSection.items.push({
            type: 'list-item',
            content: trimmedLine
          });
        } else {
          // 如果没有当前section，直接添加到格式化内容中
          formattedContent.push({
            type: 'list-item',
            content: trimmedLine
          });
        }
      }
      // 普通段落
      else {
        // 如果有当前section，将段落添加到其中
        if (currentSection) {
          currentSection.items.push({
            type: 'paragraph',
            content: trimmedLine
          });
        } else {
          // 如果没有当前section，直接添加到格式化内容中
          formattedContent.push({
            type: 'paragraph',
            content: trimmedLine
          });
        }
      }
      
      // 如果是最后一行，确保保存当前section
      if (index === lines.length - 1 && currentSection && currentSection.items.length > 0) {
        formattedContent.push(currentSection);
      }
    });

    return formattedContent;
  }, []);

  // 使用捕获阶段处理滚轮事件，确保能在事件冒泡前捕获并阻止
  useEffect(() => {
    // 全局捕获滚轮事件
    const handleGlobalWheel = (e: WheelEvent) => {
      // 如果点击在容器内部，阻止事件继续传播
      if (containerRef.current?.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    // 在捕获阶段注册事件
    window.addEventListener('wheel', handleGlobalWheel, { capture: true });
    
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel, { capture: true });
    };
  }, []);

  // 内容区滚动处理
  useEffect(() => {
    const contentContainer = scrollContentRef.current;
    if (!contentContainer) return;

    const handleContentWheel = (e: WheelEvent) => {
      // 阻止默认行为和冒泡
      e.preventDefault();
      e.stopPropagation();
      
      // 手动控制滚动
      contentContainer.scrollTop += e.deltaY;
    };

    contentContainer.addEventListener('wheel', handleContentWheel, { passive: false });
    
    return () => {
      contentContainer.removeEventListener('wheel', handleContentWheel);
    };
  }, []);

  const formattedContent = formatContent(content);

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000]"
      onClick={(e) => {
        // 点击遮罩层时关闭
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card 
        ref={containerRef}
        className="absolute right-0 top-[10vh] shadow-xl border-l-2 bg-background overflow-hidden"
        style={{ 
          zIndex: 1001,
          width: 'auto',
          minWidth: '400px',
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="sticky top-0 z-10 bg-background p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-sm font-medium ${typeStyle}`}>
              {typeText}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                className="flex items-center gap-1 h-8"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? t('copied') : t('copyContent')}</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        
        <div 
          ref={scrollContentRef}
          className="p-4 pt-0 bg-background flex-1 overflow-y-auto"
          style={{ maxHeight: 'calc(80vh - 9rem)' }}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none pr-4 pb-4 bg-background">
            {/* 保留第一个标题作为function title */}
            {formattedContent.length > 0 && formattedContent[0].type === 'h1' && (
              <h1 className="text-2xl font-bold mt-4 mb-4 pb-2 border-b">
                {formattedContent[0].content}
              </h1>
            )}
            
            {/* 处理其余内容，将相关内容组合到一个callout中 */}
            {(() => {
              // 跳过第一个标题（如果存在）
              const startIndex = formattedContent.length > 0 && formattedContent[0].type === 'h1' ? 1 : 0;
              let currentSection = null;
              const renderedItems = [];
              
              for (let i = startIndex; i < formattedContent.length; i++) {
                const item = formattedContent[i];
                
                // 如果是标题，开始一个新的section
                if (['h1', 'h2', 'h3'].includes(item.type)) {
                  // 如果有当前section，先渲染它
                  if (currentSection) {
                    renderedItems.push(
                      <Callout key={`section-${currentSection.index}`} title={currentSection.title} variant="default">
                        {currentSection.content}
                      </Callout>
                    );
                  }
                  
                  // 创建新的section
                  currentSection = {
                    index: i,
                    title: item.content,
                    content: []
                  };
                }
                // 如果是section类型，直接使用它的内容
                else if (item.type === 'section') {
                  // 如果有当前section，先渲染它
                  if (currentSection) {
                    renderedItems.push(
                      <Callout key={`section-${currentSection.index}`} title={currentSection.title} variant="default">
                        {currentSection.content}
                      </Callout>
                    );
                    currentSection = null;
                  }
                  
                  // 渲染section的内容
                  renderedItems.push(
                    <Callout key={`section-direct-${i}`} title={item.title} variant="default">
                      {item.items && item.items.map((subItem, subIndex) => {
                        switch (subItem.type) {
                          case 'list-item':
                            return (
                              <div key={`item-${i}-${subIndex}`} className="flex ml-2 mb-2">
                                <span className="mr-2">{subItem.content.startsWith('-') ? '•' : '•'}</span>
                                <span className="text-sm">{subItem.content.substring(1).trim()}</span>
                              </div>
                            );
                          default:
                            return (
                              <p key={`item-${i}-${subIndex}`} className="my-2 text-sm">
                                {subItem.content}
                              </p>
                            );
                        }
                      })}
                    </Callout>
                  );
                }
                // 如果是其他内容类型，添加到当前section
                else {
                  if (currentSection) {
                    if (item.type === 'list-item') {
                      currentSection.content.push(
                        <div key={`content-${i}`} className="flex ml-2 mb-2">
                          <span className="mr-2">{item.content.startsWith('-') ? '•' : '•'}</span>
                          <span className="text-sm">{item.content.substring(1).trim()}</span>
                        </div>
                      );
                    } else {
                      currentSection.content.push(
                        <p key={`content-${i}`} className="my-2 text-sm">
                          {item.content}
                        </p>
                      );
                    }
                  }
                  // 如果没有当前section，创建一个无标题的section
                  else {
                    if (item.type === 'list-item') {
                      renderedItems.push(
                        <Callout key={`item-${i}`} variant="default">
                          <div className="flex ml-2 mb-2">
                            <span className="mr-2">{item.content.startsWith('-') ? '•' : '•'}</span>
                            <span className="text-sm">{item.content.substring(1).trim()}</span>
                          </div>
                        </Callout>
                      );
                    } else {
                      renderedItems.push(
                        <Callout key={`item-${i}`} variant="default">
                          <p className="my-1 text-sm">
                            {item.content}
                          </p>
                        </Callout>
                      );
                    }
                  }
                }
              }
              
              // 渲染最后一个section（如果有）
              if (currentSection) {
                renderedItems.push(
                  <Callout key={`section-last`} title={currentSection.title} variant="default">
                    {currentSection.content}
                  </Callout>
                );
              }
              
              return renderedItems;
            })()}
          </div>
        </div>
      </Card>
    </div>
  );
};
