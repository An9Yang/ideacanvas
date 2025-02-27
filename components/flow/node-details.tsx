"use client";

import { useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { NodeType } from '@/lib/types/flow';

interface NodeDetailsProps {
  title: string;
  content: string;
  type: NodeType;
  onClose: () => void;
}

const getTypeText = (type: NodeType) => {
  switch (type) {
    case 'external':
      return '外部服务';
    case 'context':
      return '上下文信息';
    case 'guide':
      return '开发指南';
    default:
      return '产品功能';
  }
};

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
  const typeText = getTypeText(type);
  const typeStyle = getTypeStyle(type);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatContent = useCallback((content: string) => {
    // 处理内容，将其分割成段落并标记格式
    const formattedContent: Array<{
      type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list-item';
      content: string;
    }> = [];

    const lines = content.split('\n');
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // 跳过空行
      if (!trimmedLine) return;
      
      // 处理Markdown风格的标题
      if (trimmedLine.startsWith('# ')) {
        formattedContent.push({
          type: 'h1',
          content: trimmedLine.substring(2)
        });
      } else if (trimmedLine.startsWith('## ')) {
        formattedContent.push({
          type: 'h2',
          content: trimmedLine.substring(3)
        });
      } else if (trimmedLine.startsWith('### ')) {
        formattedContent.push({
          type: 'h3',
          content: trimmedLine.substring(4)
        });
      } 
      // 处理数字编号
      else if (/^\d+\.\s/.test(trimmedLine)) {
        formattedContent.push({
          type: 'h2',
          content: trimmedLine
        });
      }
      // 处理字母编号
      else if (/^[a-z]\)\s/i.test(trimmedLine)) {
        formattedContent.push({
          type: 'h3',
          content: trimmedLine
        });
      }
      // 处理列表项
      else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        formattedContent.push({
          type: 'list-item',
          content: trimmedLine
        });
      }
      // 普通段落
      else {
        formattedContent.push({
          type: 'paragraph',
          content: trimmedLine
        });
      }
    });

    return formattedContent;
  }, []);

  // 阻止滚轮事件传播到画布
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 如果在滚动区域内，阻止事件传播
      if (e.target instanceof Node && container.contains(e.target)) {
        e.stopPropagation();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
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
        className="absolute right-0 top-0 bottom-0 shadow-xl border-l-2 bg-background"
        style={{ 
          zIndex: 1001,
          width: 'auto',
          minWidth: '400px',
          maxWidth: '800px',
          maxHeight: '90vh'
        }}
      >
        <div className="sticky top-0 z-10 bg-background p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${typeStyle}`}>
                {typeText}
              </span>
              <h2 className="text-2xl font-bold mt-2">{title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 pt-0 bg-background">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="prose prose-sm dark:prose-invert max-w-none pr-4 bg-background">
              {formattedContent.map((item, index) => {
                switch (item.type) {
                  case 'h1':
                    return (
                      <h1 key={index} className="text-2xl font-bold mt-8 mb-4 pb-2 border-b">
                        {item.content}
                      </h1>
                    );
                  case 'h2':
                    return (
                      <h2 key={index} className="text-xl font-bold mt-6 mb-3">
                        {item.content}
                      </h2>
                    );
                  case 'h3':
                    return (
                      <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
                        {item.content}
                      </h3>
                    );
                  case 'list-item':
                    return (
                      <div key={index} className="flex ml-4 mb-2 bg-background">
                        <span className="mr-2">{item.content.startsWith('-') ? '•' : '•'}</span>
                        <p>{item.content.substring(1).trim()}</p>
                      </div>
                    );
                  default:
                    return (
                      <p key={index} className="my-2">
                        {item.content}
                      </p>
                    );
                }
              })}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
};
