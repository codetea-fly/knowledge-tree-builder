// 步骤执行器框架
// 这个框架提供了一个可扩展的架构，用于实现不同类型审核步骤的功能

// 导出类型定义
export type {
  StepExecutionContext,
  StepExecutionCallbacks,
  InputRequestConfig,
  StepExecutionOutput,
  IStepExecutor,
} from '@/types/stepExecutor';

export { BaseStepExecutor } from '@/types/stepExecutor';

// 导出具体执行器
export { FileParseExecutor } from './FileParseExecutor';
export { QAInteractionExecutor } from './QAInteractionExecutor';
export { SingleSelectExecutor } from './SingleSelectExecutor';
export { MultiSelectExecutor } from './MultiSelectExecutor';
export { ScriptCheckExecutor } from './ScriptCheckExecutor';
export { SubWorkflowExecutor } from './SubWorkflowExecutor';

// 导出注册表
export { stepExecutorRegistry, StepExecutorRegistry } from './StepExecutorRegistry';

/**
 * 使用说明：
 * 
 * 1. 使用现有执行器：
 * 
 * ```typescript
 * import { stepExecutorRegistry } from '@/executors';
 * 
 * const executor = stepExecutorRegistry.get('file_parse');
 * if (executor) {
 *   const result = await executor.execute(context);
 * }
 * ```
 * 
 * 2. 扩展新的步骤类型：
 * 
 * ```typescript
 * import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/executors';
 * import { stepExecutorRegistry } from '@/executors';
 * 
 * class MyCustomExecutor extends BaseStepExecutor {
 *   readonly stepType = 'my_custom_type' as StepType;
 *   
 *   async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
 *     // 实现自定义逻辑
 *     return this.createSuccessOutput('执行成功');
 *   }
 *   
 *   validateConfig(config: CheckItemConfig) {
 *     return { valid: true, errors: [] };
 *   }
 *   
 *   getUIComponentName() {
 *     return 'MyCustomUI';
 *   }
 *   
 *   getDescription() {
 *     return '自定义步骤类型描述';
 *   }
 * }
 * 
 * // 注册自定义执行器
 * stepExecutorRegistry.register(new MyCustomExecutor());
 * ```
 * 
 * 3. 设置工作流提供者（用于子流程执行器）：
 * 
 * ```typescript
 * import { stepExecutorRegistry } from '@/executors';
 * 
 * // 在应用初始化时设置
 * stepExecutorRegistry.setWorkflowProvider(() => workflowLibrary.workflows);
 * ```
 */
