'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FlowList } from './flow-list';
import { CloudFlow } from '@/lib/services/cloud-storage.service';
import { useFlowStore } from '@/lib/stores/flow-store';
import { useToast } from '@/components/ui/use-toast';

interface FlowManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: string;
}

export function FlowManagerDialog({ open, onOpenChange, language = 'zh' }: FlowManagerDialogProps) {
  const { loadCloudFlow } = useFlowStore();
  const { toast } = useToast();

  const handleLoadFlow = async (flow: CloudFlow) => {
    try {
      if (loadCloudFlow) {
        await loadCloudFlow(flow.id);
      }
      onOpenChange(false);
      toast({
        title: language === 'zh' ? '加载成功' : 'Load Successful',
        description: language === 'zh' 
          ? `已加载流程图：${flow.name}` 
          : `Loaded flow: ${flow.name}`,
      });
    } catch (error) {
      console.error('Failed to load flow:', error);
      toast({
        title: language === 'zh' ? '加载失败' : 'Load Failed',
        description: language === 'zh' 
          ? '无法加载流程图' 
          : 'Failed to load flow',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'zh' ? '流程图管理' : 'Flow Management'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' 
              ? '查看和管理您保存在云端的流程图' 
              : 'View and manage your flows saved in the cloud'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <FlowList onLoadFlow={handleLoadFlow} language={language} />
        </div>
      </DialogContent>
    </Dialog>
  );
}