import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  GitBranch,
  Clock,
  User,
  Users,
  Building,
  CheckCircle2,
  Settings2,
} from 'lucide-react';
import { ReviewWorkflow, WorkflowStep, defaultWorkflow } from '@/types/workflow';
import { toast } from 'sonner';

interface WorkflowConfigProps {
  value?: ReviewWorkflow;
  onChange?: (workflow: ReviewWorkflow) => void;
}

const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const AssigneeIcon: React.FC<{ type: WorkflowStep['assignee_type'] }> = ({ type }) => {
  switch (type) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'role':
      return <Users className="h-4 w-4" />;
    case 'department':
      return <Building className="h-4 w-4" />;
  }
};

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (step: WorkflowStep) => void;
  onDelete: () => void;
  totalSteps: number;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  totalSteps,
}) => {
  return (
    <div className="relative">
      {/* Connection line */}
      {index < totalSteps - 1 && (
        <div className="absolute left-6 top-full w-0.5 h-4 bg-border" />
      )}
      
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className={cn(
          'border transition-all',
          isExpanded ? 'border-primary/50 shadow-sm' : 'border-border'
        )}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {step.name || '未命名步骤'}
                    </CardTitle>
                    {step.required && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        必需
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <AssigneeIcon type={step.assignee_type} />
                      {step.assignee_value || '未指定'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.timeout_hours}小时
                    </span>
                  </div>
                </div>
                
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">步骤名称</Label>
                  <Input
                    value={step.name}
                    onChange={(e) => onUpdate({ ...step, name: e.target.value })}
                    placeholder="如：初审、复审"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">超时时间（小时）</Label>
                  <Input
                    type="number"
                    value={step.timeout_hours}
                    onChange={(e) => onUpdate({ ...step, timeout_hours: parseInt(e.target.value) || 24 })}
                    min={1}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">步骤描述</Label>
                <Textarea
                  value={step.description}
                  onChange={(e) => onUpdate({ ...step, description: e.target.value })}
                  placeholder="描述此步骤的职责和要求"
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">审批人类型</Label>
                  <Select
                    value={step.assignee_type}
                    onValueChange={(v) => onUpdate({ ...step, assignee_type: v as WorkflowStep['assignee_type'] })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">角色</SelectItem>
                      <SelectItem value="user">指定用户</SelectItem>
                      <SelectItem value="department">部门</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">审批人/角色/部门</Label>
                  <Input
                    value={step.assignee_value}
                    onChange={(e) => onUpdate({ ...step, assignee_value: e.target.value })}
                    placeholder={
                      step.assignee_type === 'user' ? '用户名或ID' :
                      step.assignee_type === 'role' ? '角色名称' : '部门名称'
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.required}
                    onCheckedChange={(checked) => onUpdate({ ...step, required: checked })}
                    id={`required-${step.id}`}
                  />
                  <Label htmlFor={`required-${step.id}`} className="text-xs text-muted-foreground">
                    此步骤为必需
                  </Label>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      删除步骤
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除步骤 "{step.name}" 吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export const WorkflowConfig: React.FC<WorkflowConfigProps> = ({
  value = defaultWorkflow,
  onChange,
}) => {
  const [workflow, setWorkflow] = useState<ReviewWorkflow>(value);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const updateWorkflow = (updates: Partial<ReviewWorkflow>) => {
    const newWorkflow = { ...workflow, ...updates };
    setWorkflow(newWorkflow);
    onChange?.(newWorkflow);
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: generateId(),
      name: `步骤 ${workflow.steps.length + 1}`,
      description: '',
      assignee_type: 'role',
      assignee_value: '',
      timeout_hours: 24,
      required: true,
      conditions: [],
    };
    updateWorkflow({ steps: [...workflow.steps, newStep] });
    setExpandedSteps(new Set([...expandedSteps, newStep.id]));
    toast.success('已添加新步骤');
  };

  const updateStep = (stepId: string, updates: WorkflowStep) => {
    updateWorkflow({
      steps: workflow.steps.map((s) => (s.id === stepId ? updates : s)),
    });
  };

  const deleteStep = (stepId: string) => {
    updateWorkflow({
      steps: workflow.steps.filter((s) => s.id !== stepId),
    });
    toast.success('步骤已删除');
  };

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">审核流程配置</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={workflow.enabled}
              onCheckedChange={(checked) => updateWorkflow({ enabled: checked })}
              id="workflow-enabled"
            />
            <Label htmlFor="workflow-enabled" className="text-sm">
              {workflow.enabled ? '已启用' : '已禁用'}
            </Label>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">流程名称</Label>
            <Input
              value={workflow.name}
              onChange={(e) => updateWorkflow({ name: e.target.value })}
              placeholder="审核流程名称"
              className="h-8 text-sm bg-background"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">流程描述</Label>
            <Textarea
              value={workflow.description}
              onChange={(e) => updateWorkflow({ description: e.target.value })}
              placeholder="描述此审核流程的用途"
              className="text-sm min-h-[60px] resize-none bg-background"
            />
          </div>
        </div>
      </div>

      {/* Steps Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">审核步骤</h2>
          <span className="text-xs text-muted-foreground">
            ({workflow.steps.length} 个步骤)
          </span>
        </div>
        <Button size="sm" onClick={addStep}>
          <Plus className="h-4 w-4 mr-1.5" />
          添加步骤
        </Button>
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {workflow.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Settings2 className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">暂无审核步骤</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={addStep}>
                <Plus className="h-4 w-4 mr-1" />
                添加第一个步骤
              </Button>
            </div>
          ) : (
            workflow.steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isExpanded={expandedSteps.has(step.id)}
                onToggle={() => toggleStep(step.id)}
                onUpdate={(updated) => updateStep(step.id, updated)}
                onDelete={() => deleteStep(step.id)}
                totalSteps={workflow.steps.length}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
