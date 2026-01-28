import React, { useState, useCallback } from 'react';
import { WorkflowProvider, useWorkflow } from '@/context/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Loader2,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { 
  ReviewWorkflow, 
  WorkflowStep, 
  StepExecutionResult, 
  ReviewExecutionResult,
} from '@/types/workflow';
import { Link } from 'react-router-dom';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';

const ReviewPageContent: React.FC = () => {
  const { library } = useWorkflow();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ReviewExecutionResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const selectedWorkflow = library.workflows.find(w => w.id === selectedWorkflowId);
  const getWorkflow = useCallback((id: string) => library.workflows.find(w => w.id === id), [library.workflows]);

  // 执行审核
  const runReview = useCallback(async () => {
    if (!selectedWorkflow) return;

    setIsRunning(true);
    setCurrentStepIndex(0);

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
  }, [selectedWorkflow, getWorkflow]);

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

        {/* Execution status in header */}
        {executionResult && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
            executionResult.status === 'running' && 'bg-blue-100 text-blue-700',
            executionResult.status === 'completed' && executionResult.overallSuccess && 'bg-green-100 text-green-700',
            executionResult.status === 'completed' && !executionResult.overallSuccess && 'bg-red-100 text-red-700',
          )}>
            {executionResult.status === 'running' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                执行中 ({currentStepIndex}/{totalSteps})
              </>
            ) : executionResult.overallSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                审核通过
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                {executionResult.failedSteps.length} 项未通过
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Workflow Selection */}
        <div className="w-[320px] border-r border-border bg-muted/30 p-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
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

          {/* Progress Card */}
          {(isRunning || executionResult) && (
            <Card>
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

          {/* Result Summary */}
          {executionResult && executionResult.status === 'completed' && (
            <Card className={cn(
              'border-2',
              executionResult.overallSuccess ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
            )}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  {executionResult.overallSuccess ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {executionResult.overallSuccess ? '审核通过' : '审核未通过'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {executionResult.overallSuccess 
                        ? '所有检查项均已通过' 
                        : `${executionResult.failedSteps.length} 个步骤未通过`}
                    </p>
                  </div>
                </div>
                {!executionResult.overallSuccess && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-red-700">未通过项目：</p>
                    <ul className="list-disc list-inside text-red-600">
                      {executionResult.failedSteps.slice(0, 5).map((name, idx) => (
                        <li key={idx} className="truncate">{name}</li>
                      ))}
                      {executionResult.failedSteps.length > 5 && (
                        <li>...还有 {executionResult.failedSteps.length - 5} 项</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Canvas Preview */}
        <div className="flex-1 overflow-hidden">
          {selectedWorkflow ? (
            <WorkflowCanvas
              workflow={selectedWorkflow}
              executionResult={executionResult?.stepResults}
              getWorkflow={getWorkflow}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">选择审核流程</p>
                <p className="text-sm">在左侧选择一个流程以预览其结构</p>
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
