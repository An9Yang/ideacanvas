'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CloudFlow } from '@/lib/services/cloud-storage.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Calendar, FileJson, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { cloudStorageService } from '@/lib/services/cloud-storage.service';

interface FlowListProps {
  onLoadFlow: (flow: CloudFlow) => void;
  language?: string;
}

export function FlowList({ onLoadFlow, language = 'zh' }: FlowListProps) {
  const [flows, setFlows] = useState<CloudFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { toast } = useToast();
  const locale = language === 'zh' ? zhCN : enUS;

  const fetchFlows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flows', {
        headers: {
          'x-user-id': 'default-user',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlows(data.flows || []);
      } else {
        throw new Error('Failed to fetch flows');
      }
    } catch (error) {
      console.error('Failed to fetch flows:', error);
      toast({
        title: language === 'zh' ? '加载失败' : 'Load Failed',
        description: language === 'zh' ? '无法加载流程图列表' : 'Failed to load flow list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [language, toast]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleDelete = async (flowId: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这个流程图吗？' : 'Are you sure you want to delete this flow?')) {
      return;
    }

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'default-user',
        },
      });

      if (response.ok) {
        toast({
          title: language === 'zh' ? '删除成功' : 'Delete Successful',
          description: language === 'zh' ? '流程图已删除' : 'Flow has been deleted',
        });
        fetchFlows();
      } else {
        throw new Error('Failed to delete flow');
      }
    } catch (error) {
      console.error('Failed to delete flow:', error);
      toast({
        title: language === 'zh' ? '删除失败' : 'Delete Failed',
        description: language === 'zh' ? '无法删除流程图' : 'Failed to delete flow',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (flow: CloudFlow) => {
    setEditingId(flow.id);
    setEditingName(flow.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveRename = async (flowId: string) => {
    if (!editingName.trim()) {
      cancelEditing();
      return;
    }

    try {
      await cloudStorageService.updateFlow(flowId, { name: editingName.trim() });
      toast({
        title: language === 'zh' ? '重命名成功' : 'Rename Successful',
        description: language === 'zh' ? '流程图名称已更新' : 'Flow name has been updated',
      });
      fetchFlows();
      cancelEditing();
    } catch (error) {
      console.error('Failed to rename flow:', error);
      toast({
        title: language === 'zh' ? '重命名失败' : 'Rename Failed',
        description: language === 'zh' ? '无法更新流程图名称' : 'Failed to update flow name',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">
          {language === 'zh' ? '加载中...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FileJson className="w-12 h-12 mb-4 opacity-50" />
        <p>{language === 'zh' ? '还没有保存的流程图' : 'No saved flows yet'}</p>
        <p className="text-sm mt-2">
          {language === 'zh' 
            ? '生成的流程图会自动保存到云端' 
            : 'Generated flows will be automatically saved to cloud'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {flows.map((flow) => (
        <Card key={flow.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingId === flow.id ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(flow.id);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="h-8 text-lg font-semibold"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => saveRename(flow.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEditing}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{flow.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(flow)}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(flow.updatedAt), { 
                    addSuffix: true,
                    locale 
                  })}
                </span>
                <span>
                  {flow.nodes.length} {language === 'zh' ? '节点' : 'nodes'}, 
                  {flow.edges.length} {language === 'zh' ? '连接' : 'edges'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLoadFlow(flow)}
                className="flex items-center gap-1"
                disabled={editingId === flow.id}
              >
                <Download className="w-4 h-4" />
                {language === 'zh' ? '加载' : 'Load'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(flow.id)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                disabled={editingId === flow.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}