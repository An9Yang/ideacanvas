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
    default:
      return 'bg-background text-foreground';
  }
};

export const NodeDetails = ({ title, content, type, onClose }: NodeDetailsProps) => {
  const typeText = getTypeText(type);
  const typeStyle = getTypeStyle(type);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatContent = useCallback((content: string) => {
    // 将数字和字母编号转换为标题样式
    return content.split('\n').map((line, index) => {
      // 匹配主标题（数字编号）
      if (/^\d+\.\s/.test(line)) {
        return `\n## ${line}\n`;
      }
      // 匹配子标题（字母编号）
      if (/^[a-z]\)\s/i.test(line)) {
        return `\n### ${line.substring(3)}\n`;
      }
      // 匹配列表项
      if (/^\s*-\s/.test(line)) {
        return line;
      }
      return line;
    }).join('\n');
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

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
      onClick={(e) => {
        // 点击遮罩层时关闭
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card 
        ref={containerRef}
        className="absolute right-0 top-0 bottom-0 w-[500px] shadow-xl border-l-2 bg-background"
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
        
        <div className="p-6 pt-0">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="prose prose-sm dark:prose-invert pr-4">
              {formatContent(content).split('\n').map((line, index) => (
                <div key={index}>
                  {line.startsWith('##') ? (
                    <h2 className="text-xl font-bold mt-6 mb-4">
                      {line.replace('##', '').trim()}
                    </h2>
                  ) : line.startsWith('###') ? (
                    <h3 className="text-lg font-semibold mt-4 mb-2">
                      {line.replace('###', '').trim()}
                    </h3>
                  ) : line.trim() ? (
                    <p className="my-1">{line}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
};
