import React, { useState } from 'react';
import { useWorkflow } from '@/context/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Save,
  Trash2,
  Download,
  Copy,
  Plus,
  Settings2,
} from 'lucide-react';
import { WorkflowStep, STEP_TYPES, createDefaultStep, StepType } from '@/types/workflow';
import { WorkflowStepCard } from './WorkflowStepCard';
import { AddStepDialog } from './AddStepDialog';
import { toast } from 'sonner';

export const WorkflowDetailPanel: React.FC = () => {
  const { 
    selectedWorkflow, 
    updateWorkflow, 
    deleteWorkflow, 
    duplicateWorkflow,
    exportWorkflow,
    addStep,
    saveToLocal,
  } = useWorkflow();
  
  const [showAddStepDialog, setShowAddStepDialog] = useState(false);

  if (!selectedWorkflow) return null;

  const handleUpdateField = (field: string, value: any) => {
    updateWorkflow({ ...selectedWorkflow, [field]: value });
  };

  const handleAddStep = (stepType: StepType) => {
    const newStep = createDefaultStep(stepType);
    addStep(selectedWorkflow.id, newStep);
    setShowAddStepDialog(false);
    toast.success('步骤已添加');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">流程配置</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveToLocal}>
              <Save className="h-4 w-4 mr-1" />
              保存到本地
            </Button>
            <Button variant="outline" size="sm" onClick={() => duplicateWorkflow(selectedWorkflow.id)}>
              <Copy className="h-4 w-4 mr-1" />
              复制
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportWorkflow(selectedWorkflow.id)}>
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除流程 "{selectedWorkflow.name}" 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteWorkflow(selectedWorkflow.id)}>
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">流程名称（唯一）</Label>
              <Input
                value={selectedWorkflow.name}
                onChange={(e) => handleUpdateField('name', e.target.value)}
                placeholder="审核流程名称"
                className="h-8 text-sm bg-background"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch
                checked={selectedWorkflow.enabled}
                onCheckedChange={(checked) => handleUpdateField('enabled', checked)}
                id="workflow-enabled"
              />
              <Label htmlFor="workflow-enabled" className="text-sm">
                {selectedWorkflow.enabled ? '已启用' : '已禁用'}
              </Label>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">流程描述</Label>
            <Textarea
              value={selectedWorkflow.description}
              onChange={(e) => handleUpdateField('description', e.target.value)}
              placeholder="描述此审核流程的用途和适用场景"
              className="text-sm min-h-[60px] resize-none bg-background"
            />
          </div>
        </div>
      </div>

      {/* Steps Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">审核步骤</span>
          <span className="text-xs text-muted-foreground">
            ({selectedWorkflow.steps.length} 个步骤)
          </span>
        </div>
        <Button size="sm" onClick={() => setShowAddStepDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          添加步骤
        </Button>
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {selectedWorkflow.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Settings2 className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">暂无审核步骤</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => setShowAddStepDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加第一个步骤
              </Button>
            </div>
          ) : (
            selectedWorkflow.steps.map((step, index) => (
              <WorkflowStepCard
                key={step.id}
                step={step}
                index={index}
                workflowId={selectedWorkflow.id}
                totalSteps={selectedWorkflow.steps.length}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Step Dialog */}
      <AddStepDialog
        open={showAddStepDialog}
        onOpenChange={setShowAddStepDialog}
        onSelectType={handleAddStep}
        workflowId={selectedWorkflow.id}
      />
    </div>
  );
};
