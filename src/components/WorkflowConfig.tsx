import React from 'react';
import { WorkflowProvider, useWorkflow } from '@/context/WorkflowContext';
import { WorkflowLibraryPanel } from './workflow/WorkflowLibraryPanel';
import { WorkflowDetailPanel } from './workflow/WorkflowDetailPanel';

const WorkflowConfigContent: React.FC = () => {
  const { selectedWorkflow } = useWorkflow();

  return (
    <div className="h-full flex overflow-hidden">
      {/* 左侧流程库 */}
      <WorkflowLibraryPanel />
      
      {/* 右侧流程详情 */}
      <div className="flex-1 overflow-hidden">
        {selectedWorkflow ? (
          <WorkflowDetailPanel />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">请选择或创建一个审核流程</p>
              <p className="text-sm">从左侧流程库中选择一个流程进行配置</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const WorkflowConfig: React.FC = () => {
  return (
    <WorkflowProvider>
      <WorkflowConfigContent />
    </WorkflowProvider>
  );
};

export default WorkflowConfig;
