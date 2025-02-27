"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Play, Save, FolderOpen, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFlowStore } from "@/lib/stores/flow-store";
import { APIKeyDialog } from "@/components/settings/api-key-dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface FlowToolbarProps {
  onAddNode: () => void;
  onExecuteFlow: () => void;
}

export function FlowToolbar({ onAddNode, onExecuteFlow }: FlowToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const { flows, saveFlow, loadFlow } = useFlowStore();
  const { t } = useTranslation();

  const handleSave = () => {
    if (flowName) {
      saveFlow(flowName);
      setFlowName("");
      setIsOpen(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      <TooltipProvider>
        <APIKeyDialog />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onAddNode} variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('addNode')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('addNodeTooltip')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onExecuteFlow} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              {t('executeFlow')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('executeFlowTooltip')}</p>
          </TooltipContent>
        </Tooltip>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t('saveFlow')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('saveFlow')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t('enterFlowName')}
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
              />
              <Button onClick={handleSave} disabled={!flowName}>
                {t('save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Select onValueChange={loadFlow}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <SelectValue placeholder={t('loadFlow')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {flows.map((flow) => (
              <SelectItem key={flow.id} value={flow.id}>
                {flow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <p>{t('howToUse')}:</p>
              <ul className="text-sm list-disc list-inside">
                <li>{t('apiKeySettings')}</li>
                <li>{t('addNodeHint')}</li>
                <li>{t('typePromptHint')}</li>
                <li>{t('connectNodesHint')}</li>
                <li>{t('saveFlowHint')}</li>
                <li>{t('executeFlowHint')}</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}