import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  MessageSquare,
  CircleDot,
  CheckSquare,
  Code,
  GitBranch,
} from 'lucide-react';
import { StepType, STEP_TYPES } from '@/types/workflow';

const stepTypeIcons: Record<StepType, React.ElementType> = {
  file_parse: FileText,
  qa_interaction: MessageSquare,
  single_select: CircleDot,
  multi_select: CheckSquare,
  script_check: Code,
  sub_workflow: GitBranch,
};

interface AddStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: StepType) => void;
  workflowId: string;
}

export const AddStepDialog: React.FC<AddStepDialogProps> = ({
  open,
  onOpenChange,
  onSelectType,
  workflowId,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加审核步骤</DialogTitle>
          <DialogDescription>
            选择步骤类型，一旦选定后无法修改类型
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          {STEP_TYPES.map((stepType) => {
            const Icon = stepTypeIcons[stepType.type];
            const isSubWorkflow = stepType.type === 'sub_workflow';
            
            return (
              <Button
                key={stepType.type}
                variant="outline"
                className={cn(
                  'h-auto py-4 px-4 flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5',
                  isSubWorkflow && 'col-span-2'
                )}
                onClick={() => onSelectType(stepType.type)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{stepType.label}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {stepType.description}
                </p>
              </Button>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <strong>提示：</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>检查项类型包括：文件解析、问答交互、单选/多选、脚本检查</li>
            <li>子流程可以引用流程库中的其他流程，系统会自动检测循环引用</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
