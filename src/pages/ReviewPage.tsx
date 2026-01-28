import React, { useState, useCallback } from 'react';
import { WorkflowProvider, useWorkflow } from '@/context/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  FileText,
  MessageSquare,
  CircleDot,
  CheckSquare,
  Code,
  GitBranch,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { 
  ReviewWorkflow, 
  WorkflowStep, 
  StepExecutionResult, 
  ReviewExecutionResult,
  StepType,
  StepStatus,
} from '@/types/workflow';
import { Link } from 'react-router-dom';

const stepTypeIcons: Record<StepType, React.ElementType> = {
  file_parse: FileText,
  qa_interaction: MessageSquare,
  single_select: CircleDot,
  multi_select: CheckSquare,
  script_check: Code,
  sub_workflow: GitBranch,
};

interface StepResultCardProps {
  result: StepExecutionResult;
  depth?: number;
}

const StepResultCard: React.FC<StepResultCardProps> = ({ result, depth = 0 }) => {
  const Icon = stepTypeIcons[result.stepType] || FileText;
  
  const statusConfig: Record<StepStatus, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: 'text-muted-foreground', label: '等待中' },
    running: { icon: Loader2, color: 'text-blue-500', label: '执行中' },
    success: { icon: CheckCircle2, color: 'text-green-500', label: '通过' },
    failed: { icon: XCircle, color: 'text-red-500', label: '失败' },
    skipped: { icon: ChevronRight, color: 'text-muted-foreground', label: '跳过' },
  };
  
  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-6 border-l-2 border-muted pl-4')}>
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-md border',
        result.status === 'running' && 'border-blue-200 bg-blue-50',
        result.status === 'success' && 'border-green-200 bg-green-50',
        result.status === 'failed' && 'border-red-200 bg-red-50',
        result.status === 'pending' && 'border-muted bg-muted/30',
      )}>
        <div className="w-8 h-8 rounded-md bg-background border flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{result.stepName}</span>
            {result.stepType === 'sub_workflow' && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                子流程
              </span>
            )}
          </div>
          {result.message && (
            <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
          )}
        </div>
        <div className={cn('flex items-center gap-1', config.color)}>
          <StatusIcon className={cn('h-4 w-4', result.status === 'running' && 'animate-spin')} />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>
      
      {/* Sub-workflow results */}
      {result.subWorkflowResults && result.subWorkflowResults.length > 0 && (
        <div className="space-y-2">
          {result.subWorkflowResults.map((subResult) => (
            <StepResultCard key={subResult.stepId} result={subResult} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewPageContent: React.FC = () => {
  const { library } = useWorkflow();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ReviewExecutionResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const selectedWorkflow = library.workflows.find(w => w.id === selectedWorkflowId);

  // 递归获取所有步骤（包括子流程）
  const flattenSteps = useCallback((
    steps: WorkflowStep[],
    getWorkflow: (id: string) => ReviewWorkflow | undefined
  ): { step: WorkflowStep; isSubWorkflow: boolean; parentWorkflowName?: string }[] => {
    const result: { step: WorkflowStep; isSubWorkflow: boolean; parentWorkflowName?: string }[] = [];
    
    for (const step of steps) {
      if (step.stepType === 'sub_workflow' && step.subWorkflowConfig?.workflowId) {
        const subWorkflow = getWorkflow(step.subWorkflowConfig.workflowId);
        if (subWorkflow) {
          result.push({ step, isSubWorkflow: true });
          const subSteps = flattenSteps(subWorkflow.steps, getWorkflow);
          subSteps.forEach(s => {
            result.push({ ...s, parentWorkflowName: subWorkflow.name });
          });
        }
      } else {
        result.push({ step, isSubWorkflow: false });
      }
    }
    
    return result;
  }, []);

  // 执行审核
  const runReview = useCallback(async () => {
    if (!selectedWorkflow) return;

    setIsRunning(true);
    setCurrentStepIndex(0);

    const getWorkflow = (id: string) => library.workflows.find(w => w.id === id);
    
    // 初始化执行结果
    const initStepResults = (steps: WorkflowStep[]): StepExecutionResult[] => {
      return steps.map(step => {
        const result: StepExecutionResult = {
          stepId: step.id,
          stepName: step.name,
          stepType: step.stepType,
          status: 'pending',
        };
        
        if (step.stepType === 'sub_workflow' && step.subWorkflowConfig?.workflowId) {
          const subWorkflow = getWorkflow(step.subWorkflowConfig.workflowId);
          if (subWorkflow) {
            result.subWorkflowResults = initStepResults(subWorkflow.steps);
          }
        }
        
        return result;
      });
    };

    const result: ReviewExecutionResult = {
      workflowId: selectedWorkflow.id,
      workflowName: selectedWorkflow.name,
      status: 'running',
      startTime: new Date().toISOString(),
      stepResults: initStepResults(selectedWorkflow.steps),
      overallSuccess: true,
      failedSteps: [],
    };

    setExecutionResult(result);

    // 递归执行步骤
    const executeSteps = async (
      stepResults: StepExecutionResult[],
      updateResult: () => void
    ) => {
      for (const stepResult of stepResults) {
        // 设置为运行中
        stepResult.status = 'running';
        stepResult.startTime = new Date().toISOString();
        updateResult();
        
        // 模拟执行（等待2秒）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 如果是子流程，递归执行
        if (stepResult.subWorkflowResults && stepResult.subWorkflowResults.length > 0) {
          await executeSteps(stepResult.subWorkflowResults, updateResult);
          
          // 检查子流程是否全部成功
          const subFailed = stepResult.subWorkflowResults.some(r => r.status === 'failed');
          stepResult.status = subFailed ? 'failed' : 'success';
        } else {
          // 随机决定是否失败（约20%概率）
          const shouldFail = Math.random() < 0.2;
          stepResult.status = shouldFail ? 'failed' : 'success';
          stepResult.message = shouldFail ? '检查未通过，存在不符合项' : '检查通过';
        }
        
        stepResult.endTime = new Date().toISOString();
        updateResult();
        setCurrentStepIndex(prev => prev + 1);
      }
    };

    await executeSteps(result.stepResults, () => {
      setExecutionResult({ ...result });
    });

    // 计算最终结果
    const collectFailedSteps = (results: StepExecutionResult[]): string[] => {
      const failed: string[] = [];
      for (const r of results) {
        if (r.status === 'failed') {
          failed.push(r.stepName);
        }
        if (r.subWorkflowResults) {
          failed.push(...collectFailedSteps(r.subWorkflowResults));
        }
      }
      return failed;
    };

    result.failedSteps = collectFailedSteps(result.stepResults);
    result.overallSuccess = result.failedSteps.length === 0;
    result.status = 'completed';
    result.endTime = new Date().toISOString();
    
    setExecutionResult({ ...result });
    setIsRunning(false);
  }, [selectedWorkflow, library.workflows]);

  const resetReview = () => {
    setExecutionResult(null);
    setCurrentStepIndex(0);
  };

  // 计算总步骤数
  const getTotalSteps = useCallback((steps: WorkflowStep[]): number => {
    let count = 0;
    for (const step of steps) {
      count++;
      if (step.stepType === 'sub_workflow' && step.subWorkflowConfig?.workflowId) {
        const subWorkflow = library.workflows.find(w => w.id === step.subWorkflowConfig?.workflowId);
        if (subWorkflow) {
          count += getTotalSteps(subWorkflow.steps);
        }
      }
    }
    return count;
  }, [library.workflows]);

  const totalSteps = selectedWorkflow ? getTotalSteps(selectedWorkflow.steps) : 0;
  const progress = totalSteps > 0 ? (currentStepIndex / totalSteps) * 100 : 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回配置中心
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">质量管理体系合规性审核</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Workflow Selection */}
        <div className="w-[350px] border-r border-border bg-muted/30 p-4 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">选择审核流程</CardTitle>
              <CardDescription>从流程库中选择要执行的审核流程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedWorkflowId}
                onValueChange={setSelectedWorkflowId}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择流程" />
                </SelectTrigger>
                <SelectContent>
                  {library.workflows.filter(w => w.enabled).map(workflow => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedWorkflow && (
                <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                  <p className="text-muted-foreground">{selectedWorkflow.description || '无描述'}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>步骤数：{selectedWorkflow.steps.length}</span>
                    <span>总步骤：{totalSteps}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={runReview}
                  disabled={!selectedWorkflowId || isRunning}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      审核中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      开始审核
                    </>
                  )}
                </Button>
                {executionResult && !isRunning && (
                  <Button variant="outline" onClick={resetReview}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {(isRunning || executionResult) && (
            <Card className="mt-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">执行进度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>已完成 {currentStepIndex} / {totalSteps} 步骤</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Execution Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {executionResult ? (
            <>
              {/* Result Header */}
              <div className={cn(
                'p-4 border-b',
                executionResult.status === 'completed' && executionResult.overallSuccess && 'bg-green-50 border-green-200',
                executionResult.status === 'completed' && !executionResult.overallSuccess && 'bg-red-50 border-red-200',
                executionResult.status === 'running' && 'bg-blue-50 border-blue-200',
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {executionResult.status === 'running' ? (
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    ) : executionResult.overallSuccess ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {executionResult.status === 'running' 
                          ? '正在执行审核...' 
                          : executionResult.overallSuccess 
                            ? '审核通过' 
                            : '审核未通过'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {executionResult.workflowName}
                      </p>
                    </div>
                  </div>
                  {executionResult.status === 'completed' && !executionResult.overallSuccess && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {executionResult.failedSteps.length} 个步骤未通过
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {executionResult.failedSteps.slice(0, 3).join('、')}
                        {executionResult.failedSteps.length > 3 && ' 等'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Results List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {executionResult.stepResults.map((result) => (
                    <StepResultCard key={result.stepId} result={result} />
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">选择流程并开始审核</p>
                <p className="text-sm">审核结果将在此处显示</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReviewPage: React.FC = () => {
  return (
    <WorkflowProvider>
      <ReviewPageContent />
    </WorkflowProvider>
  );
};

export default ReviewPage;
