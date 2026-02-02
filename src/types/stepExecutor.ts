import { StepType, WorkflowStep, CheckItemConfig, SubWorkflowConfig } from './workflow';

// 步骤执行上下文 - 包含执行过程中需要的所有信息
export interface StepExecutionContext {
  // 当前步骤信息
  step: WorkflowStep;
  // 工作流ID
  workflowId: string;
  // 工作流名称
  workflowName: string;
  // 用户输入/上传的数据
  userInput?: unknown;
  // 上一步的执行结果
  previousResult?: StepExecutionOutput;
  // 整个流程的共享数据
  sharedData: Record<string, unknown>;
  // 回调函数
  callbacks: StepExecutionCallbacks;
}

// 步骤执行回调
export interface StepExecutionCallbacks {
  // 更新进度
  onProgress?: (progress: number, message: string) => void;
  // 请求用户输入
  onRequestInput?: (config: InputRequestConfig) => Promise<unknown>;
  // 日志输出
  onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;
}

// 验证规则（与stepApi.ts保持一致）
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

// 输入请求配置
export interface InputRequestConfig {
  type: 'file' | 'text' | 'select' | 'multiselect' | 'confirm' | 'custom';
  title: string;
  description?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  validation?: ValidationRule[] | ((value: unknown) => string | null);
  customComponent?: string;
}

// 步骤执行输出
export interface StepExecutionOutput {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  // 需要用户确认/操作
  requiresUserAction?: boolean;
  userActionConfig?: InputRequestConfig;
}

// 步骤执行器接口 - 所有步骤类型都需要实现这个接口
export interface IStepExecutor<TConfig = CheckItemConfig | SubWorkflowConfig> {
  // 步骤类型
  readonly stepType: StepType;
  
  // 执行步骤
  execute(context: StepExecutionContext): Promise<StepExecutionOutput>;
  
  // 验证步骤配置是否有效
  validateConfig(config: TConfig): { valid: boolean; errors: string[] };
  
  // 获取步骤的UI渲染组件名称（用于动态渲染）
  getUIComponentName(): string;
  
  // 获取步骤描述
  getDescription(): string;
}

// 步骤执行器基类 - 提供通用功能
export abstract class BaseStepExecutor<TConfig = CheckItemConfig> implements IStepExecutor<TConfig> {
  abstract readonly stepType: StepType;
  
  abstract execute(context: StepExecutionContext): Promise<StepExecutionOutput>;
  
  abstract validateConfig(config: TConfig): { valid: boolean; errors: string[] };
  
  abstract getUIComponentName(): string;
  
  abstract getDescription(): string;
  
  // 通用辅助方法
  protected log(context: StepExecutionContext, level: 'info' | 'warn' | 'error', message: string): void {
    context.callbacks.onLog?.(level, `[${this.stepType}] ${message}`);
  }
  
  protected updateProgress(context: StepExecutionContext, progress: number, message: string): void {
    context.callbacks.onProgress?.(progress, message);
  }
  
  protected async requestUserInput(
    context: StepExecutionContext, 
    config: InputRequestConfig
  ): Promise<unknown> {
    if (!context.callbacks.onRequestInput) {
      throw new Error('User input callback not provided');
    }
    return context.callbacks.onRequestInput(config);
  }
  
  protected createSuccessOutput(message: string, data?: unknown): StepExecutionOutput {
    return { success: true, message, data };
  }
  
  protected createErrorOutput(message: string, error?: string): StepExecutionOutput {
    return { success: false, message, error };
  }
  
  protected createUserActionOutput(
    message: string, 
    actionConfig: InputRequestConfig
  ): StepExecutionOutput {
    return {
      success: false,
      message,
      requiresUserAction: true,
      userActionConfig: actionConfig,
    };
  }
}
