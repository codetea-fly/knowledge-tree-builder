import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';
import { stepApiClient } from '@/services/stepApiClient';
import { MultiSelectRequest } from '@/types/stepApi';

export class MultiSelectExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'multi_select';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始多选步骤');
    this.updateProgress(context, 0, '等待用户选择...');
    
    // 获取选项配置
    const options = config?.options || [];
    
    if (options.length === 0) {
      return this.createErrorOutput('配置错误', '没有可用的选项');
    }
    
    // 构建API请求
    const apiRequest: Omit<MultiSelectRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
      optionsConfig: {
        options: options.map(opt => ({
          label: opt.label,
          value: opt.value,
          isCorrect: opt.isCorrect,
        })),
        minSelect: config?.minSelect,
        maxSelect: config?.maxSelect,
        shuffle: config?.shuffleOptions,
      },
    };
    
    // 如果没有用户输入，请求选择
    if (!context.userInput) {
      return this.createUserActionOutput('请选择一个或多个选项', {
        type: 'multiselect',
        title: context.step.name,
        description: context.step.description,
        options: options.map(opt => ({ label: opt.label, value: opt.value })),
        required: true,
      });
    }
    
    // 添加用户选择
    apiRequest.selectedValues = Array.isArray(context.userInput) 
      ? context.userInput.map(String)
      : [String(context.userInput)];
    
    this.updateProgress(context, 50, '正在验证选择...');
    
    try {
      // 调用后端API
      const response = await stepApiClient.multiSelect(apiRequest);
      
      this.updateProgress(context, 100, '选择完成');
      
      if (response.success && response.data?.success) {
        this.log(context, 'info', `多选完成，得分: ${response.data.data?.score}`);
        return this.createSuccessOutput(response.data.message, response.data.data);
      } else {
        // 检查是否需要用户操作
        if (response.data?.requiresUserAction) {
          return {
            success: false,
            message: response.data.message,
            requiresUserAction: true,
            userActionConfig: response.data.userActionConfig,
          };
        }
        
        this.log(context, 'warn', `多选验证未通过: ${response.message}`);
        return this.createErrorOutput(response.data?.message || '选择不完全正确', response.message);
      }
    } catch (error) {
      this.log(context, 'error', `多选处理失败: ${error}`);
      return this.createErrorOutput('处理失败', String(error));
    }
  }
  
  validateConfig(config: CheckItemConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.options || !Array.isArray(config.options)) {
      errors.push('选项配置必须是数组');
    } else if (config.options.length < 2) {
      errors.push('至少需要配置2个选项');
    } else {
      // 检查选项格式
      config.options.forEach((opt, index) => {
        if (!opt.label || !opt.value) {
          errors.push(`选项 ${index + 1} 缺少 label 或 value`);
        }
      });
      
      // 检查是否有重复的value
      const values = config.options.map(opt => opt.value);
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
        errors.push('选项的 value 不能重复');
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  getUIComponentName(): string {
    return 'MultiSelectUI';
  }
  
  getDescription(): string {
    return '展示多个选项供用户多选，可配置正确答案进行评分验证';
  }
}
