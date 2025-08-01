'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Code, FileJson, Eye, Loader2 } from 'lucide-react';
import { useFlowStore } from '@/lib/stores/flow-store';
import { useLanguageStore } from '@/lib/stores/language-store';
import { codeGenerationService } from '@/lib/services/code-generation/code-generation.service';
import { toast } from '@/lib/utils/toast';
import { CodePreview } from './CodePreview';
import { CodeEditor } from './CodeEditor';
import { APIDocViewer } from './APIDocViewer';

interface CodeGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CodeGeneratorDialog({ open, onClose }: CodeGeneratorDialogProps) {
  const { nodes, edges } = useFlowStore();
  const { language } = useLanguageStore();
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('preview');
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [showInitialPrompt, setShowInitialPrompt] = useState(true);
  const [generationStage, setGenerationStage] = useState('');

  const handleGenerate = async () => {
    if (nodes.length === 0) {
      toast.error(language === 'zh' ? '请先生成流程图' : 'Please generate a flow first');
      return;
    }

    setShowInitialPrompt(false);
    setGenerating(true);
    
    try {
      // 实际的生成阶段
      setGenerationStage(language === 'zh' ? '查找项目文档节点...' : 'Finding project document node...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGenerationStage(language === 'zh' ? '准备AI提示词...' : 'Preparing AI prompt...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGenerationStage(language === 'zh' ? '调用AI生成代码中（可能需要30-60秒）...' : 'Calling AI to generate code (may take 30-60s)...');
      
      // 查找文档节点或内容最丰富的节点
      let documentNode = nodes.find(node => node.type === 'document');
      if (!documentNode) {
        documentNode = nodes.reduce((best, node) => {
          // 兼容两种数据格式
          const currentContent = node.data?.content || (node as any)?.content || '';
          const bestContent = best?.data?.content || (best as any)?.content || '';
          return currentContent.length > bestContent.length ? node : best;
        }, nodes[0]);
      }
      
      // 获取内容，兼容两种格式
      const nodeContent = documentNode?.data?.content || (documentNode as any)?.content;
      const nodeTitle = documentNode?.data?.label || documentNode?.data?.title || (documentNode as any)?.title;
      
      if (!nodeContent) {
        throw new Error(language === 'zh' ? '未找到包含内容的节点' : 'No node with content found');
      }
      
      // 调用真正的 AI 生成 API
      const response = await fetch('/api/generate-code-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentContent: nodeContent,
          options: {
            language,
            styling: 'tailwind'
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Code generation failed');
      }
      
      const result = await response.json();
      
      setGenerationResult(result);
      toast.success(
        language === 'zh' 
          ? '代码生成成功！' 
          : 'Code generated successfully!'
      );
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(
        language === 'zh' 
          ? '代码生成失败，请重试' 
          : 'Code generation failed, please try again'
      );
    } finally {
      setGenerating(false);
      setGenerationStage('');
    }
  };

  const handleClose = () => {
    setShowInitialPrompt(true);
    setGenerationResult(null);
    setGenerating(false);
    setGenerationStage('');
    onClose();
  };

  const handleDownload = async () => {
    if (!generationResult) return;

    try {
      const blob = await codeGenerationService.exportProject(generationResult);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-app.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(
        language === 'zh' 
          ? '项目下载成功！' 
          : 'Project downloaded successfully!'
      );
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(
        language === 'zh' 
          ? '下载失败，请重试' 
          : 'Download failed, please try again'
      );
    }
  };

  useEffect(() => {
    // 重置状态当对话框打开时
    if (open) {
      setShowInitialPrompt(true);
      setGenerationResult(null);
      setSelectedTab('preview');
    }
  }, [open]);

  const getFileContent = (type: string) => {
    if (!generationResult) return '';
    
    switch (type) {
      case 'html':
        return generationResult.pages[0]?.html || '';
      case 'css':
        return generationResult.styles.find((s: any) => s.name === 'styles.css')?.content || '';
      case 'javascript':
        return generationResult.scripts.find((s: any) => s.name === 'app.js')?.content || '';
      case 'api':
        return generationResult.apiSpec;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {language === 'zh' ? '应用代码生成器' : 'App Code Generator'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' 
              ? '基于您的流程图生成完整的Web应用代码' 
              : 'Generate complete web application code based on your flow diagram'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showInitialPrompt ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-6 max-w-2xl">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {language === 'zh' ? '准备生成应用代码' : 'Ready to Generate Application Code'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'zh' 
                      ? '基于您的流程图，我们将生成一个完整的Web应用，包括：'
                      : 'Based on your flow diagram, we will generate a complete web application including:'}
                  </p>
                  <ul className="text-left space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{language === 'zh' ? 'HTML页面和UI组件' : 'HTML pages and UI components'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{language === 'zh' ? 'CSS样式（支持Tailwind/Bootstrap）' : 'CSS styles (Tailwind/Bootstrap support)'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{language === 'zh' ? 'JavaScript交互逻辑' : 'JavaScript interaction logic'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{language === 'zh' ? 'API接口文档' : 'API interface documentation'}</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleGenerate}
                  className="px-8"
                >
                  <Code className="w-5 h-5 mr-2" />
                  {language === 'zh' ? '开始生成代码' : 'Start Code Generation'}
                </Button>
              </div>
            </div>
          ) : generating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {language === 'zh' ? '正在生成代码...' : 'Generating code...'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {generationStage}
                  </p>
                </div>
              </div>
            </div>
          ) : generationResult ? (
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {language === 'zh' ? '实时预览' : 'Live Preview'}
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="javascript" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  JavaScript
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  {language === 'zh' ? 'API文档' : 'API Docs'}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-4">
                <TabsContent value="preview" className="h-full m-0">
                  <CodePreview html={generationResult.pages[0]?.html || generationResult.preview} />
                </TabsContent>
                
                <TabsContent value="html" className="h-full m-0">
                  <CodeEditor
                    code={getFileContent('html')}
                    language="html"
                    readOnly={false}
                  />
                </TabsContent>
                
                <TabsContent value="javascript" className="h-full m-0">
                  <CodeEditor
                    code={getFileContent('javascript')}
                    language="javascript"
                    readOnly={false}
                  />
                </TabsContent>
                
                <TabsContent value="api" className="h-full m-0">
                  <APIDocViewer spec={getFileContent('api')} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                {language === 'zh' ? '没有生成结果' : 'No generation result'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            {language === 'zh' ? '关闭' : 'Close'}
          </Button>
          {generationResult && (
            <Button onClick={handleDownload} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {language === 'zh' ? '下载项目' : 'Download Project'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}