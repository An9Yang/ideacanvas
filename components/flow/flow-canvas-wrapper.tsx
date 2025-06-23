"use client";

import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Loader2 } from 'lucide-react';

// Lazy load the flow canvas for better performance
const FlowCanvas = lazy(() => 
  import('./flow-canvas').then(module => ({ 
    default: module.FlowCanvas 
  }))
);

/**
 * Loading component for flow canvas
 */
function FlowCanvasLoader() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">加载流程编辑器...</p>
      </div>
    </div>
  );
}

/**
 * Error fallback for flow canvas
 */
function FlowCanvasError() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-lg font-semibold">流程编辑器加载失败</p>
        <p className="text-sm text-muted-foreground">
          请刷新页面重试
        </p>
      </div>
    </div>
  );
}

/**
 * Flow canvas wrapper with error boundary and lazy loading
 */
export function FlowCanvasWrapper() {
  return (
    <ErrorBoundary fallback={<FlowCanvasError />}>
      <Suspense fallback={<FlowCanvasLoader />}>
        <FlowCanvas />
      </Suspense>
    </ErrorBoundary>
  );
}