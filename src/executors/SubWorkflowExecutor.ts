import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput, IStepExecutor } from '@/types/stepExecutor';
import { SubWorkflowConfig, StepType, ReviewWorkflow, WorkflowStep } from '@/types/workflow';

// 子流程执行器需要能够获取工作流和其他执行器
export interface SubWorkflowExecutorDependencies {
  getWorkflowById: (id: string) => ReviewWorkflow | undefined;
  getExecutor: (stepType: StepType) => IStepExecutor | undefined;
}

export class SubWorkflowExecutor extends BaseStepExecutor<SubWorkflowConfig> {
  readonly stepType: StepType = 'sub_workflow';
  
  private dependencies?: SubWorkflowExecutorDependencies;
  
  // 设置依赖
  setDependencies(deps: SubWorkflowExecutorDependencies): void {
    this.dependencies = deps;
  }
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.subWorkflowConfig;
    
    this.log(context, 'info', `开始子流程: ${config?.workflowName || '未知流程'}`);
    this.updateProgress(context, 0, '正在加载子流程...');
    
    if (!config?.workflowId) {
      return this.createErrorOutput('配置错误', '未指定子流程');
    }
    
    if (!this.dependencies) {
      return this.createErrorOutput('系统错误', '执行器依赖未配置');
    }
    
    // 获取子流程定义
    const subWorkflow = this.dependencies.getWorkflowById(config.workflowId);
    
    if (!subWorkflow) {
      return this.createErrorOutput('流程不存在', `找不到子流程: ${config.workflowName}`);
    }
    
    if (!subWorkflow.enabled) {
      return this.createErrorOutput('流程已禁用', `子流程 "${subWorkflow.name}" 已被禁用`);
    }
    
    this.updateProgress(context, 10, `开始执行子流程 "${subWorkflow.name}"...`);
    
    try {
      // 执行子流程的所有步骤
      const results = await this.executeSubWorkflowSteps(
        subWorkflow,
        context
      );
      
      this.updateProgress(context, 100, '子流程执行完成');
      
      // 检查是否所有步骤都成功
      const failedSteps = results.filter(r => !r.success);
      
      if (failedSteps.length === 0) {
        this.log(context, 'info', `子流程 "${subWorkflow.name}" 执行成功`);
        return this.createSuccessOutput(`子流程 "${subWorkflow.name}" 执行成功`, {
          subWorkflowId: subWorkflow.id,
          subWorkflowName: subWorkflow.name,
          stepResults: results,
          totalSteps: results.length,
          successfulSteps: results.length,
        });
      } else {
        this.log(context, 'warn', `子流程 "${subWorkflow.name}" 部分步骤失败`);
        return this.createErrorOutput(
          `子流程有 ${failedSteps.length} 个步骤失败`,
          failedSteps.map(r => r.message).join('; ')
        );
      }
    } catch (error) {
      this.log(context, 'error', `子流程执行出错: ${error}`);
      return this.createErrorOutput('子流程执行出错', String(error));
    }
  }
  
  validateConfig(config: SubWorkflowConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.workflowId) {
      errors.push('必须指定子流程ID');
    }
    
    if (!config.workflowName) {
      errors.push('必须指定子流程名称');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  getUIComponentName(): string {
    return 'SubWorkflowUI';
  }
  
  getDescription(): string {
    return '引用并执行流程库中的其他审核流程，支持流程复用';
  }
  
  // 私有方法：递归执行子流程步骤
  private async executeSubWorkflowSteps(
    workflow: ReviewWorkflow,
    parentContext: StepExecutionContext
  ): Promise<StepExecutionOutput[]> {
    const results: StepExecutionOutput[] = [];
    const totalSteps = this.countSteps(workflow.steps);
    let completedSteps = 0;
    
    const executeStep = async (step: WorkflowStep): Promise<StepExecutionOutput> => {
      const executor = this.dependencies?.getExecutor(step.stepType);
      
      if (!executor) {
        return {
          success: false,
          message: `未找到步骤类型 "${step.stepType}" 的执行器`,
        };
      }
      
      // 创建子步骤的执行上下文
      const stepContext: StepExecutionContext = {
        step,
        workflowId: workflow.id,
        workflowName: workflow.name,
        sharedData: parentContext.sharedData,
        previousResult: results[results.length - 1],
        callbacks: {
          ...parentContext.callbacks,
          onProgress: (progress, message) => {
            // 计算总体进度
            const stepProgress = (completedSteps + progress / 100) / totalSteps;
            const overallProgress = 10 + stepProgress * 80; // 10-90% 用于子步骤
            parentContext.callbacks.onProgress?.(overallProgress, `[${step.name}] ${message}`);
          },
        },
      };
      
      const result = await executor.execute(stepContext);
      completedSteps++;
      
      return result;
    };
    
    // 递归执行所有步骤
    const executeStepsRecursive = async (steps: WorkflowStep[]): Promise<void> => {
      for (const step of steps) {
        const result = await executeStep(step);
        results.push(result);
        
        // 如果步骤是必需的且失败了，停止执行
        if (!result.success && step.required) {
          return;
        }
        
        // 如果有子步骤，递归执行
        if (step.children && step.children.length > 0) {
          await executeStepsRecursive(step.children);
        }
      }
    };
    
    await executeStepsRecursive(workflow.steps);
    
    return results;
  }
  
  // 计算总步骤数（包括嵌套步骤）
  private countSteps(steps: WorkflowStep[]): number {
    let count = 0;
    for (const step of steps) {
      count++;
      if (step.children) {
        count += this.countSteps(step.children);
      }
    }
    return count;
  }
}
