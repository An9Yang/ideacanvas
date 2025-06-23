"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Cloud } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { FlowManagerDialog } from "./flow-manager-dialog";

interface FlowToolbarProps {
}

export function FlowToolbar() {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { t, language } = useTranslation();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      <TooltipProvider>

        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setIsManagerOpen(true)}
        >
          <Cloud className="w-4 h-4" />
          {language === 'zh' ? '云端流程图' : 'Cloud Flows'}
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <p>{language === 'zh' ? '使用提示：' : 'How to use:'}</p>
              <ul className="text-sm list-disc list-inside">
                <li>{language === 'zh' ? '流程图会自动保存到云端' : 'Flows are automatically saved to cloud'}</li>
                <li>{language === 'zh' ? '点击云端流程图查看已保存的内容' : 'Click Cloud Flows to view saved content'}</li>
                <li>{language === 'zh' ? '在下方输入框输入需求生成流程图' : 'Type your requirements below to generate flow'}</li>
                <li>{language === 'zh' ? '拖动节点调整位置' : 'Drag nodes to adjust positions'}</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <FlowManagerDialog 
        open={isManagerOpen} 
        onOpenChange={setIsManagerOpen}
        language={language}
      />
    </div>
  );
}