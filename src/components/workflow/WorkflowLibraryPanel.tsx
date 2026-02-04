import React, { useState, useRef } from 'react';
import { useWorkflow } from '@/context/WorkflowContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { WorkflowStep, stepTypeLabels } from '@/types/workflow';
import {
  Plus,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Download,
  Upload,
  FileUp,
  FileText,
  MessageSquare,
  CheckCircle,
  ListChecks,
  Code,
  Workflow,
} from 'lucide-react';

const stepTypeIcons: Record<string, React.ElementType> = {
  file_parse: FileText,
  qa_interaction: MessageSquare,
  single_select: CheckCircle,
  multi_select: ListChecks,
  script_check: Code,
  sub_workflow: Workflow,
};

interface StepTreeNodeProps {
  step: WorkflowStep;
  depth: number;
}

const StepTreeNode: React.FC<StepTreeNodeProps> = ({ step, depth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = step.children && step.children.length > 0;
  const Icon = stepTypeIcons[step.stepType] || FileText;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 text-xs text-muted-foreground hover:bg-muted/50 rounded cursor-pointer'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) setIsExpanded(!isExpanded);
        }}
      >
        {hasChildren ? (
          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate flex-1">{step.name}</span>
        <span className="text-[10px] px-1 py-0.5 bg-muted rounded">
          {stepTypeLabels[step.stepType]}
        </span>
      </div>
      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-dashed border-border"
            style={{ marginLeft: `${depth * 12 + 16}px` }}
          />
          {step.children!.map((child) => (
            <StepTreeNode key={child.id} step={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const WorkflowLibraryPanel: React.FC = () => {
  const { 
    library, 
    selectedWorkflowId, 
    selectWorkflow, 
    addWorkflow,
    importWorkflow,
    saveToLocal,
    loadFromLocal,
  } = useWorkflow();

  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleWorkflowExpand = (workflowId: string) => {
    setExpandedWorkflows(prev => {
      const next = new Set(prev);
      if (next.has(workflowId)) {
        next.delete(workflowId);
      } else {
        next.add(workflowId);
      }
      return next;
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importWorkflow(file);
      // Reset input so the same file can be imported again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="w-[280px] border-r border-border bg-muted/30 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm text-foreground">审核流程库</span>
          </div>
          <Button size="sm" variant="outline" onClick={addWorkflow}>
            <Plus className="h-4 w-4 mr-1" />
            新建
          </Button>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={saveToLocal}>
            <Download className="h-3 w-3 mr-1" />
            保存
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={loadFromLocal}>
            <Upload className="h-3 w-3 mr-1" />
            加载
          </Button>
        </div>
        <div className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={handleImportClick}>
            <FileUp className="h-3 w-3 mr-1" />
            导入流程 JSON
          </Button>
        </div>
      </div>

      {/* Workflow List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {library.workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>暂无审核流程</p>
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2"
                onClick={addWorkflow}
              >
                创建第一个流程
              </Button>
            </div>
          ) : (
            library.workflows.map(workflow => {
              const isSelected = selectedWorkflowId === workflow.id;
              const isExpanded = expandedWorkflows.has(workflow.id);
              const hasSteps = workflow.steps.length > 0;

              return (
                <div key={workflow.id}>
                  <button
                    onClick={() => selectWorkflow(workflow.id)}
                    className={cn(
                      'w-full flex items-center gap-1 px-2 py-2 rounded-md text-left transition-colors',
                      isSelected 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {hasSteps ? (
                      <button
                        className="p-0.5 hover:bg-muted rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWorkflowExpand(workflow.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <div className="w-5" />
                    )}

                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 text-primary shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {workflow.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {workflow.steps.length} 个步骤
                      </div>
                    </div>
                  </button>

                  {/* Steps Tree */}
                  {isExpanded && hasSteps && (
                    <div className="relative ml-2">
                      <div className="absolute left-3 top-0 bottom-0 border-l border-dashed border-border" />
                      {workflow.steps.map((step) => (
                        <StepTreeNode key={step.id} step={step} depth={1} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border text-xs text-muted-foreground text-center">
        共 {library.workflows.length} 个流程
      </div>
    </div>
  );
};