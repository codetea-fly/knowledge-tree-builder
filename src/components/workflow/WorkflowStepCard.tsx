import React, { useState } from 'react';
import { useWorkflow } from '@/context/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  CircleDot,
  CheckSquare,
  Code,
  GitBranch,
  GripVertical,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { WorkflowStep, StepType, STEP_TYPES, QAQuestionItem, generateId } from '@/types/workflow';

const stepTypeIcons: Record<StepType, React.ElementType> = {
  file_parse: FileText,
  qa_interaction: MessageSquare,
  single_select: CircleDot,
  multi_select: CheckSquare,
  script_check: Code,
  sub_workflow: GitBranch,
};

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  workflowId: string;
  totalSteps: number;
}

export const WorkflowStepCard: React.FC<WorkflowStepCardProps> = ({
  step,
  index,
  workflowId,
  totalSteps,
}) => {
  const { updateStep, deleteStep, getAvailableSubWorkflows, library } = useWorkflow();
  const [isExpanded, setIsExpanded] = useState(false);

  const StepIcon = stepTypeIcons[step.stepType] || FileText;
  const stepTypeInfo = STEP_TYPES.find(t => t.type === step.stepType);
  const availableSubWorkflows = getAvailableSubWorkflows(workflowId);

  const handleUpdate = (updates: Partial<WorkflowStep>) => {
    updateStep(workflowId, step.id, updates);
  };

  const handleAddOption = () => {
    const options = step.checkConfig?.options || [];
    handleUpdate({
      checkConfig: {
        ...step.checkConfig,
        options: [...options, { label: '新选项', value: `option-${options.length + 1}` }],
      },
    });
  };

  const handleUpdateOption = (idx: number, field: string, value: any) => {
    const options = [...(step.checkConfig?.options || [])];
    options[idx] = { ...options[idx], [field]: value };
    handleUpdate({ checkConfig: { ...step.checkConfig, options } });
  };

  const handleRemoveOption = (idx: number) => {
    const options = step.checkConfig?.options?.filter((_, i) => i !== idx) || [];
    handleUpdate({ checkConfig: { ...step.checkConfig, options } });
  };

  const renderStepConfig = () => {
    switch (step.stepType) {
      case 'file_parse':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">支持的文件类型</Label>
              <Input
                value={step.checkConfig?.fileTypes?.join(', ') || ''}
                onChange={(e) => handleUpdate({
                  checkConfig: {
                    ...step.checkConfig,
                    fileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                  },
                })}
                placeholder="pdf, docx, xlsx"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">解析规则</Label>
              <Textarea
                value={step.checkConfig?.parseRules || ''}
                onChange={(e) => handleUpdate({
                  checkConfig: { ...step.checkConfig, parseRules: e.target.value },
                })}
                placeholder="描述文件解析规则"
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>
        );

      case 'qa_interaction': {
        const qaQuestions = step.checkConfig?.qaQuestions || [];
        
        const handleAddQuestion = () => {
          const newQ: QAQuestionItem = {
            id: generateId(),
            question: '',
          };
          handleUpdate({
            checkConfig: {
              ...step.checkConfig,
              qaQuestions: [...qaQuestions, newQ],
            },
          });
        };

        const handleUpdateQuestion = (idx: number, updates: Partial<QAQuestionItem>) => {
          const updated = [...qaQuestions];
          updated[idx] = { ...updated[idx], ...updates };
          handleUpdate({ checkConfig: { ...step.checkConfig, qaQuestions: updated } });
        };

        const handleRemoveQuestion = (idx: number) => {
          handleUpdate({
            checkConfig: {
              ...step.checkConfig,
              qaQuestions: qaQuestions.filter((_, i) => i !== idx),
            },
          });
        };

        return (
          <div className="space-y-4">
            {/* AI验证开关 */}
            <div className="flex items-center gap-2">
              <Switch
                checked={step.checkConfig?.useAiValidation || false}
                onCheckedChange={(checked) => handleUpdate({
                  checkConfig: { ...step.checkConfig, useAiValidation: checked },
                })}
                id={`ai-validation-${step.id}`}
              />
              <Label htmlFor={`ai-validation-${step.id}`} className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                启用AI验证
              </Label>
            </div>

            {step.checkConfig?.useAiValidation && (
              <div>
                <Label className="text-xs">AI验证提示词</Label>
                <Textarea
                  value={step.checkConfig?.aiValidationPrompt || ''}
                  onChange={(e) => handleUpdate({
                    checkConfig: { ...step.checkConfig, aiValidationPrompt: e.target.value },
                  })}
                  placeholder="描述AI如何验证用户的回答，例如：判断用户的回答是否涵盖了关键要点..."
                  className="text-sm min-h-[60px]"
                />
              </div>
            )}

            {/* 问题列表 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">问题列表</Label>
              <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                <Plus className="h-3 w-3 mr-1" />
                添加问题
              </Button>
            </div>

            {qaQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                暂无问题，点击上方按钮添加
              </p>
            )}

            {qaQuestions.map((q, idx) => (
              <Card key={q.id} className="border border-border">
                <CardContent className="pt-3 pb-3 px-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground mt-1">Q{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(idx, { question: e.target.value })}
                        placeholder="输入问题内容"
                        className="text-sm min-h-[60px]"
                      />
                      <div>
                        <Label className="text-xs text-muted-foreground">期望答案（可选）</Label>
                        <Textarea
                          value={q.expectedAnswer || ''}
                          onChange={(e) => handleUpdateQuestion(idx, { expectedAnswer: e.target.value })}
                          placeholder="输入期望的答案要点"
                          className="text-sm min-h-[40px]"
                        />
                      </div>
                      {/* AI追问配置 */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={q.enableFollowUp || false}
                          onCheckedChange={(checked) => handleUpdateQuestion(idx, { enableFollowUp: checked })}
                          id={`followup-${q.id}`}
                        />
                        <Label htmlFor={`followup-${q.id}`} className="text-xs flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          启用AI动态追问
                        </Label>
                      </div>
                      {q.enableFollowUp && (
                        <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                          <div>
                            <Label className="text-xs text-muted-foreground">追问提示词</Label>
                            <Textarea
                              value={q.followUpPrompt || ''}
                              onChange={(e) => handleUpdateQuestion(idx, { followUpPrompt: e.target.value })}
                              placeholder="描述AI如何根据用户回答生成追问..."
                              className="text-sm min-h-[40px]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">最大追问轮次</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={q.maxFollowUpRounds || 3}
                              onChange={(e) => handleUpdateQuestion(idx, { maxFollowUpRounds: parseInt(e.target.value) || 3 })}
                              className="h-7 w-16 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveQuestion(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* 兼容旧单题配置 */}
            {qaQuestions.length === 0 && (
              <div className="space-y-3 border-t pt-3">
                <Label className="text-xs text-muted-foreground">或使用单题模式（旧版兼容）</Label>
                <div>
                  <Label className="text-xs">问题内容</Label>
                  <Textarea
                    value={step.checkConfig?.question || ''}
                    onChange={(e) => handleUpdate({
                      checkConfig: { ...step.checkConfig, question: e.target.value },
                    })}
                    placeholder="输入要询问的问题"
                    className="text-sm min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs">期望答案（可选）</Label>
                  <Textarea
                    value={step.checkConfig?.expectedAnswer || ''}
                    onChange={(e) => handleUpdate({
                      checkConfig: { ...step.checkConfig, expectedAnswer: e.target.value },
                    })}
                    placeholder="输入期望的答案内容"
                    className="text-sm min-h-[60px]"
                  />
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'single_select':
      case 'multi_select':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">选项配置</Label>
              <Button variant="outline" size="sm" onClick={handleAddOption}>
                <Plus className="h-3 w-3 mr-1" />
                添加选项
              </Button>
            </div>
            <div className="space-y-2">
              {(step.checkConfig?.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                    placeholder="选项文本"
                    className="h-8 text-sm flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={option.isCorrect || false}
                      onChange={(e) => handleUpdateOption(idx, 'isCorrect', e.target.checked)}
                      className="w-4 h-4"
                      title="正确答案"
                    />
                    <span className="text-xs text-muted-foreground">正确</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveOption(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!step.checkConfig?.options || step.checkConfig.options.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  暂无选项，点击上方按钮添加
                </p>
              )}
            </div>
          </div>
        );

      case 'script_check':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">脚本语言</Label>
              <Select
                value={step.checkConfig?.scriptLanguage || 'javascript'}
                onValueChange={(v) => handleUpdate({
                  checkConfig: { ...step.checkConfig, scriptLanguage: v as 'javascript' | 'python' },
                })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">脚本内容</Label>
              <Textarea
                value={step.checkConfig?.scriptContent || ''}
                onChange={(e) => handleUpdate({
                  checkConfig: { ...step.checkConfig, scriptContent: e.target.value },
                })}
                placeholder="// 输入检查脚本代码"
                className="text-sm min-h-[120px] font-mono"
              />
            </div>
          </div>
        );

      case 'sub_workflow':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">选择子流程</Label>
              <Select
                value={step.subWorkflowConfig?.workflowId || ''}
                onValueChange={(v) => {
                  const workflow = library.workflows.find(w => w.id === v);
                  handleUpdate({
                    subWorkflowConfig: {
                      workflowId: v,
                      workflowName: workflow?.name || '',
                    },
                  });
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="选择要引用的流程" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubWorkflows.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      无可用流程（可能存在循环引用）
                    </div>
                  ) : (
                    availableSubWorkflows.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {step.subWorkflowConfig?.workflowId && (
                <p className="text-xs text-muted-foreground mt-1">
                  已选择：{step.subWorkflowConfig.workflowName}
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Connection line */}
      {index < totalSteps - 1 && (
        <div className="absolute left-6 top-full w-0.5 h-3 bg-border" />
      )}

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
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

                <StepIcon className="h-4 w-4 text-primary" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {step.name || '未命名步骤'}
                    </CardTitle>
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {stepTypeInfo?.label}
                    </span>
                    {step.required && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        必需
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {step.description}
                    </p>
                  )}
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
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">步骤名称</Label>
                  <Input
                    value={step.name}
                    onChange={(e) => handleUpdate({ name: e.target.value })}
                    placeholder="步骤名称"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">步骤类型</Label>
                  <Input
                    value={stepTypeInfo?.label || ''}
                    disabled
                    className="h-8 text-sm bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">步骤描述</Label>
                <Textarea
                  value={step.description}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  placeholder="描述此步骤的检查内容"
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>

              {/* Step Type Specific Config */}
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground mb-3 block">
                  {stepTypeInfo?.label}配置
                </Label>
                {renderStepConfig()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.required}
                    onCheckedChange={(checked) => handleUpdate({ required: checked })}
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
                      <AlertDialogAction onClick={() => deleteStep(workflowId, step.id)}>
                        删除
                      </AlertDialogAction>
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
