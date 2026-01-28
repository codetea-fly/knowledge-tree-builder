import React from 'react';
import { useWorkflow } from '@/context/WorkflowContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Plus,
  GitBranch,
  ChevronRight,
  Folder,
  FolderOpen,
  Download,
  Upload,
} from 'lucide-react';

export const WorkflowLibraryPanel: React.FC = () => {
  const { 
    library, 
    selectedWorkflowId, 
    selectWorkflow, 
    addWorkflow,
    saveToLocal,
    loadFromLocal,
  } = useWorkflow();

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
              return (
                <button
                  key={workflow.id}
                  onClick={() => selectWorkflow(workflow.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
                    isSelected 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {isSelected ? (
                    <FolderOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {workflow.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {workflow.steps.length} 个步骤
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    isSelected && 'rotate-90'
                  )} />
                </button>
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
