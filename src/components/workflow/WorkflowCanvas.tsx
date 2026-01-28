import React from 'react';
import { ReviewWorkflow, WorkflowStep, StepExecutionResult, StepType, StepStatus } from '@/types/workflow';
import { cn } from '@/lib/utils';
import {
  FileText,
  MessageSquare,
  CircleDot,
  CheckSquare,
  Code,
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowDown,
} from 'lucide-react';

const stepTypeIcons: Record<StepType, React.ElementType> = {
  file_parse: FileText,
  qa_interaction: MessageSquare,
  single_select: CircleDot,
  multi_select: CheckSquare,
  script_check: Code,
  sub_workflow: GitBranch,
};

const stepTypeColors: Record<StepType, string> = {
  file_parse: 'bg-blue-100 border-blue-300 text-blue-700',
  qa_interaction: 'bg-purple-100 border-purple-300 text-purple-700',
  single_select: 'bg-green-100 border-green-300 text-green-700',
  multi_select: 'bg-teal-100 border-teal-300 text-teal-700',
  script_check: 'bg-orange-100 border-orange-300 text-orange-700',
  sub_workflow: 'bg-indigo-100 border-indigo-300 text-indigo-700',
};

const statusStyles: Record<StepStatus, { border: string; bg: string; icon: React.ElementType; iconColor: string }> = {
  pending: { border: 'border-muted-foreground/30', bg: 'bg-muted/50', icon: Clock, iconColor: 'text-muted-foreground' },
  running: { border: 'border-blue-500', bg: 'bg-blue-50', icon: Loader2, iconColor: 'text-blue-500' },
  success: { border: 'border-green-500', bg: 'bg-green-50', icon: CheckCircle2, iconColor: 'text-green-500' },
  failed: { border: 'border-red-500', bg: 'bg-red-50', icon: XCircle, iconColor: 'text-red-500' },
  skipped: { border: 'border-muted-foreground/30', bg: 'bg-muted/30', icon: Clock, iconColor: 'text-muted-foreground' },
};

interface CanvasStepNodeProps {
  step: WorkflowStep;
  status?: StepStatus;
  subWorkflowResults?: StepExecutionResult[];
  getWorkflow: (id: string) => ReviewWorkflow | undefined;
  isLast: boolean;
}

const CanvasStepNode: React.FC<CanvasStepNodeProps> = ({
  step,
  status = 'pending',
  subWorkflowResults,
  getWorkflow,
  isLast,
}) => {
  const Icon = stepTypeIcons[step.stepType];
  const typeStyle = stepTypeColors[step.stepType];
  const statusStyle = statusStyles[status];
  const StatusIcon = statusStyle.icon;

  const isSubWorkflow = step.stepType === 'sub_workflow';
  const subWorkflow = isSubWorkflow && step.subWorkflowConfig?.workflowId
    ? getWorkflow(step.subWorkflowConfig.workflowId)
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* Step Node */}
      <div
        className={cn(
          'relative w-[220px] rounded-lg border-2 p-3 transition-all duration-300 shadow-sm',
          statusStyle.border,
          statusStyle.bg,
          status === 'running' && 'ring-2 ring-blue-400 ring-offset-2'
        )}
      >
        {/* Status indicator */}
        <div className={cn(
          'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm',
          status === 'pending' && 'bg-muted',
          status === 'running' && 'bg-blue-500',
          status === 'success' && 'bg-green-500',
          status === 'failed' && 'bg-red-500',
        )}>
          <StatusIcon className={cn(
            'h-3.5 w-3.5',
            status === 'pending' ? 'text-muted-foreground' : 'text-white',
            status === 'running' && 'animate-spin'
          )} />
        </div>

        {/* Content */}
        <div className="flex items-start gap-2">
          <div className={cn('w-8 h-8 rounded flex items-center justify-center shrink-0', typeStyle)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{step.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {step.description || (isSubWorkflow ? subWorkflow?.name : '')}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-workflow expansion */}
      {isSubWorkflow && subWorkflow && (
        <div className="mt-2 relative">
          {/* Connector line */}
          <div className="absolute left-1/2 -top-2 w-px h-2 bg-border" />
          
          {/* Sub-workflow container */}
          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/50">
            <div className="text-xs text-indigo-600 font-medium mb-3 text-center">
              子流程: {subWorkflow.name}
            </div>
            <div className="flex flex-col items-center gap-2">
              {subWorkflow.steps.map((subStep, idx) => {
                const subResult = subWorkflowResults?.find(r => r.stepId === subStep.id);
                return (
                  <CanvasStepNode
                    key={subStep.id}
                    step={subStep}
                    status={subResult?.status}
                    subWorkflowResults={subResult?.subWorkflowResults}
                    getWorkflow={getWorkflow}
                    isLast={idx === subWorkflow.steps.length - 1}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Arrow to next step */}
      {!isLast && (
        <div className="flex flex-col items-center py-1">
          <div className="w-px h-4 bg-border" />
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

interface WorkflowCanvasProps {
  workflow: ReviewWorkflow;
  executionResult?: StepExecutionResult[];
  getWorkflow: (id: string) => ReviewWorkflow | undefined;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  executionResult,
  getWorkflow,
}) => {
  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-muted/30 to-muted/10 p-6">
      <div className="min-w-fit flex flex-col items-center">
        {/* Workflow Header */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold text-foreground">{workflow.name}</h3>
          {workflow.description && (
            <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
          )}
          <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
            <span>共 {workflow.steps.length} 个主步骤</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col items-center">
          {workflow.steps.map((step, index) => {
            const result = executionResult?.find(r => r.stepId === step.id);
            return (
              <CanvasStepNode
                key={step.id}
                step={step}
                status={result?.status}
                subWorkflowResults={result?.subWorkflowResults}
                getWorkflow={getWorkflow}
                isLast={index === workflow.steps.length - 1}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-muted border border-muted-foreground/30" />
            <span>等待中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>执行中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>通过</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>失败</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
