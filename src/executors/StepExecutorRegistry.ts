import { StepType, ReviewWorkflow } from '@/types/workflow';
import { IStepExecutor } from '@/types/stepExecutor';
import { FileParseExecutor } from './FileParseExecutor';
import { QAInteractionExecutor } from './QAInteractionExecutor';
import { SingleSelectExecutor } from './SingleSelectExecutor';
import { MultiSelectExecutor } from './MultiSelectExecutor';
import { ScriptCheckExecutor } from './ScriptCheckExecutor';
import { SubWorkflowExecutor } from './SubWorkflowExecutor';

// 执行器注册表 - 管理所有步骤执行器
class StepExecutorRegistry {
  private executors: Map<StepType, IStepExecutor> = new Map();
  private workflowProvider?: () => ReviewWorkflow[];
  
  constructor() {
    // 注册默认执行器
    this.registerDefaultExecutors();
  }
  
  // 注册默认执行器
  private registerDefaultExecutors(): void {
    this.register(new FileParseExecutor());
    this.register(new QAInteractionExecutor());
    this.register(new SingleSelectExecutor());
    this.register(new MultiSelectExecutor());
    this.register(new ScriptCheckExecutor());
    
    // 子流程执行器需要特殊处理
    const subWorkflowExecutor = new SubWorkflowExecutor();
    this.register(subWorkflowExecutor);
  }
  
  // 设置工作流提供者（用于子流程执行器）
  setWorkflowProvider(provider: () => ReviewWorkflow[]): void {
    this.workflowProvider = provider;
    
    // 更新子流程执行器的依赖
    const subWorkflowExecutor = this.get('sub_workflow') as SubWorkflowExecutor;
    if (subWorkflowExecutor) {
      subWorkflowExecutor.setDependencies({
        getWorkflowById: (id: string) => provider().find(w => w.id === id),
        getExecutor: (stepType: StepType) => this.get(stepType),
      });
    }
  }
  
  // 注册执行器
  register(executor: IStepExecutor): void {
    this.executors.set(executor.stepType, executor);
  }
  
  // 注销执行器
  unregister(stepType: StepType): boolean {
    return this.executors.delete(stepType);
  }
  
  // 获取执行器
  get(stepType: StepType): IStepExecutor | undefined {
    return this.executors.get(stepType);
  }
  
  // 检查是否已注册
  has(stepType: StepType): boolean {
    return this.executors.has(stepType);
  }
  
  // 获取所有已注册的执行器
  getAll(): IStepExecutor[] {
    return Array.from(this.executors.values());
  }
  
  // 获取所有已注册的步骤类型
  getRegisteredTypes(): StepType[] {
    return Array.from(this.executors.keys());
  }
  
  // 获取执行器信息列表
  getExecutorInfoList(): { type: StepType; description: string; uiComponent: string }[] {
    return this.getAll().map(executor => ({
      type: executor.stepType,
      description: executor.getDescription(),
      uiComponent: executor.getUIComponentName(),
    }));
  }
}

// 导出单例实例
export const stepExecutorRegistry = new StepExecutorRegistry();

// 导出类型用于扩展
export { StepExecutorRegistry };
