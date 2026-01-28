import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  ReviewWorkflow, 
  WorkflowLibrary, 
  WorkflowStep,
  defaultWorkflowLibrary, 
  createDefaultWorkflow,
  generateId 
} from '@/types/workflow';
import { toast } from 'sonner';

const STORAGE_KEY = 'workflow_library';

interface WorkflowContextType {
  library: WorkflowLibrary;
  selectedWorkflowId: string | null;
  selectedWorkflow: ReviewWorkflow | null;
  
  // 流程操作
  selectWorkflow: (id: string | null) => void;
  addWorkflow: () => ReviewWorkflow;
  updateWorkflow: (workflow: ReviewWorkflow) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => ReviewWorkflow;
  
  // 步骤操作
  addStep: (workflowId: string, step: WorkflowStep, parentStepId?: string) => void;
  updateStep: (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => void;
  deleteStep: (workflowId: string, stepId: string) => void;
  
  // 导出与保存
  exportWorkflow: (id: string) => void;
  saveToLocal: () => void;
  loadFromLocal: () => void;
  
  // 检查循环引用
  checkCircularReference: (workflowId: string, targetWorkflowId: string) => boolean;
  
  // 获取可用的子流程列表（排除会造成循环引用的流程）
  getAvailableSubWorkflows: (currentWorkflowId: string) => ReviewWorkflow[];
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [library, setLibrary] = useState<WorkflowLibrary>(() => {
    // 初次加载时尝试从 localStorage 读取
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.workflows)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load workflow library from localStorage:', e);
    }
    return defaultWorkflowLibrary;
  });
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const selectedWorkflow = library.workflows.find(w => w.id === selectedWorkflowId) || null;

  // 保存到本地
  const saveToLocal = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      toast.success('流程库已保存到本地');
    } catch (e) {
      console.error('Failed to save workflow library:', e);
      toast.error('保存失败');
    }
  }, [library]);

  // 从本地加载
  const loadFromLocal = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.workflows)) {
          setLibrary(parsed);
          setSelectedWorkflowId(null);
          toast.success('已从本地加载流程库');
          return;
        }
      }
      toast.info('未找到本地保存的流程库');
    } catch (e) {
      console.error('Failed to load workflow library:', e);
      toast.error('加载失败');
    }
  }, []);

  const selectWorkflow = useCallback((id: string | null) => {
    setSelectedWorkflowId(id);
  }, []);

  const addWorkflow = useCallback(() => {
    const newWorkflow = createDefaultWorkflow();
    // 确保名称唯一
    const existingNames = library.workflows.map(w => w.name);
    let name = newWorkflow.name;
    let counter = 1;
    while (existingNames.includes(name)) {
      name = `${newWorkflow.name} (${counter})`;
      counter++;
    }
    newWorkflow.name = name;
    
    setLibrary(prev => ({
      ...prev,
      workflows: [...prev.workflows, newWorkflow],
    }));
    setSelectedWorkflowId(newWorkflow.id);
    toast.success('已创建新流程');
    return newWorkflow;
  }, [library.workflows]);

  const updateWorkflow = useCallback((workflow: ReviewWorkflow) => {
    // 检查名称唯一性
    const existingWorkflow = library.workflows.find(
      w => w.name === workflow.name && w.id !== workflow.id
    );
    if (existingWorkflow) {
      toast.error('流程名称已存在，请使用其他名称');
      return;
    }
    
    setLibrary(prev => ({
      ...prev,
      workflows: prev.workflows.map(w => 
        w.id === workflow.id 
          ? { ...workflow, updatedAt: new Date().toISOString() } 
          : w
      ),
    }));
  }, [library.workflows]);

  const deleteWorkflow = useCallback((id: string) => {
    // 检查是否被其他流程引用
    const referencingWorkflows = library.workflows.filter(w => 
      w.id !== id && 
      w.steps.some(s => s.stepType === 'sub_workflow' && s.subWorkflowConfig?.workflowId === id)
    );
    
    if (referencingWorkflows.length > 0) {
      toast.error(`此流程被以下流程引用，无法删除：${referencingWorkflows.map(w => w.name).join(', ')}`);
      return;
    }
    
    setLibrary(prev => ({
      ...prev,
      workflows: prev.workflows.filter(w => w.id !== id),
    }));
    
    if (selectedWorkflowId === id) {
      setSelectedWorkflowId(null);
    }
    toast.success('流程已删除');
  }, [library.workflows, selectedWorkflowId]);

  const duplicateWorkflow = useCallback((id: string) => {
    const workflow = library.workflows.find(w => w.id === id);
    if (!workflow) return workflow!;
    
    const newWorkflow: ReviewWorkflow = {
      ...JSON.parse(JSON.stringify(workflow)),
      id: generateId(),
      name: `${workflow.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 重新生成所有步骤ID
    const regenerateStepIds = (steps: WorkflowStep[]): WorkflowStep[] => {
      return steps.map(step => ({
        ...step,
        id: generateId(),
        children: step.children ? regenerateStepIds(step.children) : undefined,
      }));
    };
    newWorkflow.steps = regenerateStepIds(newWorkflow.steps);
    
    setLibrary(prev => ({
      ...prev,
      workflows: [...prev.workflows, newWorkflow],
    }));
    setSelectedWorkflowId(newWorkflow.id);
    toast.success('流程已复制');
    return newWorkflow;
  }, [library.workflows]);

  const addStep = useCallback((workflowId: string, step: WorkflowStep, parentStepId?: string) => {
    setLibrary(prev => ({
      ...prev,
      workflows: prev.workflows.map(w => {
        if (w.id !== workflowId) return w;
        
        if (!parentStepId) {
          return {
            ...w,
            steps: [...w.steps, step],
            updatedAt: new Date().toISOString(),
          };
        }
        
        // 添加到父步骤的children中
        const addToParent = (steps: WorkflowStep[]): WorkflowStep[] => {
          return steps.map(s => {
            if (s.id === parentStepId) {
              return {
                ...s,
                children: [...(s.children || []), step],
              };
            }
            if (s.children) {
              return { ...s, children: addToParent(s.children) };
            }
            return s;
          });
        };
        
        return {
          ...w,
          steps: addToParent(w.steps),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const updateStep = useCallback((workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => {
    setLibrary(prev => ({
      ...prev,
      workflows: prev.workflows.map(w => {
        if (w.id !== workflowId) return w;
        
        const updateInSteps = (steps: WorkflowStep[]): WorkflowStep[] => {
          return steps.map(s => {
            if (s.id === stepId) {
              return { ...s, ...updates };
            }
            if (s.children) {
              return { ...s, children: updateInSteps(s.children) };
            }
            return s;
          });
        };
        
        return {
          ...w,
          steps: updateInSteps(w.steps),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const deleteStep = useCallback((workflowId: string, stepId: string) => {
    setLibrary(prev => ({
      ...prev,
      workflows: prev.workflows.map(w => {
        if (w.id !== workflowId) return w;
        
        const deleteFromSteps = (steps: WorkflowStep[]): WorkflowStep[] => {
          return steps
            .filter(s => s.id !== stepId)
            .map(s => ({
              ...s,
              children: s.children ? deleteFromSteps(s.children) : undefined,
            }));
        };
        
        return {
          ...w,
          steps: deleteFromSteps(w.steps),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    toast.success('步骤已删除');
  }, []);

  const exportWorkflow = useCallback((id: string) => {
    const workflow = library.workflows.find(w => w.id === id);
    if (!workflow) return;
    
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('流程已导出');
  }, [library.workflows]);

  // 获取流程引用的所有子流程ID（递归）
  const getReferencedWorkflowIds = useCallback((workflowId: string, visited: Set<string> = new Set()): Set<string> => {
    if (visited.has(workflowId)) return visited;
    visited.add(workflowId);
    
    const workflow = library.workflows.find(w => w.id === workflowId);
    if (!workflow) return visited;
    
    const collectFromSteps = (steps: WorkflowStep[]) => {
      for (const step of steps) {
        if (step.stepType === 'sub_workflow' && step.subWorkflowConfig?.workflowId) {
          const subId = step.subWorkflowConfig.workflowId;
          if (!visited.has(subId)) {
            getReferencedWorkflowIds(subId, visited);
          }
        }
        if (step.children) {
          collectFromSteps(step.children);
        }
      }
    };
    
    collectFromSteps(workflow.steps);
    return visited;
  }, [library.workflows]);

  // 检查循环引用：如果 targetWorkflowId 直接或间接引用了 currentWorkflowId，则会形成循环
  const checkCircularReference = useCallback((currentWorkflowId: string, targetWorkflowId: string): boolean => {
    if (currentWorkflowId === targetWorkflowId) return true;
    
    // 检查 target 是否引用了 current（直接或间接）
    const targetRefs = getReferencedWorkflowIds(targetWorkflowId, new Set());
    if (targetRefs.has(currentWorkflowId)) {
      return true;
    }
    
    return false;
  }, [getReferencedWorkflowIds]);

  const getAvailableSubWorkflows = useCallback((currentWorkflowId: string): ReviewWorkflow[] => {
    return library.workflows.filter(w => {
      if (w.id === currentWorkflowId) return false;
      // 检查选择 w 作为子流程是否会造成循环
      return !checkCircularReference(currentWorkflowId, w.id);
    });
  }, [library.workflows, checkCircularReference]);

  return (
    <WorkflowContext.Provider value={{
      library,
      selectedWorkflowId,
      selectedWorkflow,
      selectWorkflow,
      addWorkflow,
      updateWorkflow,
      deleteWorkflow,
      duplicateWorkflow,
      addStep,
      updateStep,
      deleteStep,
      exportWorkflow,
      saveToLocal,
      loadFromLocal,
      checkCircularReference,
      getAvailableSubWorkflows,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
