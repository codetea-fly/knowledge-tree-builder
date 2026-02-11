import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';
import { stepApiClient } from '@/services/stepApiClient';
import { SingleSelectRequest } from '@/types/stepApi';

export class SingleSelectExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'single_select';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始单选步骤');
    this.updateProgress(context, 0, '等待用户选择...');
    
    // 获取选项配置
    const options = config?.options || [];
    
    if (options.length === 0) {
      return this.createErrorOutput('配置错误', '没有可用的选项');
    }
    
    // 构建API请求
    const apiRequest: Omit<SingleSelectRequest, 'stepType'> = {
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
        shuffle: config?.shuffleOptions,
      },
    };
    
    // 如果没有用户输入，请求选择
    if (!context.userInput) {
      return this.createUserActionOutput('请选择一个选项', {
        type: 'select',
        title: context.step.name,
        description: context.step.description,
        options: options.map(opt => ({ label: opt.label, value: opt.value })),
        required: true,
      });
    }
    
    // 添加用户选择（UI提交的是对象 { selectedValue, selectedLabel }）
    const userInput = context.userInput as { selectedValue?: string; isMock?: boolean } | string;
    const selectedValue = typeof userInput === 'string' 
      ? userInput 
      : userInput?.selectedValue || '';
    apiRequest.selectedValue = selectedValue;
    
    this.updateProgress(context, 50, '正在验证选择...');
    
    // 在前端验证正确答案
    const selectedOption = options.find(opt => opt.value === selectedValue);
    const hasCorrectConfig = options.some(opt => opt.isCorrect !== undefined);
    
    if (!selectedOption) {
      return this.createErrorOutput('选择无效', '未找到对应选项');
    }
    
    try {
      // 调用后端API
      const response = await stepApiClient.singleSelect(apiRequest);
      
      this.updateProgress(context, 100, '选择完成');
      
      if (response.success && response.data?.success) {
        this.log(context, 'info', `选择完成: ${response.data.data?.selectedLabel}`);
        return this.createSuccessOutput(response.data.message, response.data.data);
      } else {
        if (response.data?.requiresUserAction) {
          return {
            success: false,
            message: response.data.message,
            requiresUserAction: true,
            userActionConfig: response.data.userActionConfig,
          };
        }
        
        this.log(context, 'warn', `选择验证未通过: ${response.message}`);
        return this.createErrorOutput(response.data?.message || '选择错误', response.message);
      }
    } catch (error) {
      // API调用失败时，使用前端本地验证作为降级
      this.log(context, 'warn', `API调用失败，使用本地验证: ${error}`);
      
      const isCorrect = hasCorrectConfig ? (selectedOption.isCorrect === true) : true;
      const correctOption = options.find(opt => opt.isCorrect === true);
      
      this.updateProgress(context, 100, '选择完成');
      
      if (isCorrect || !hasCorrectConfig) {
        return this.createSuccessOutput(
          hasCorrectConfig ? '选择正确' : '已选择',
          {
            selectedValue,
            selectedLabel: selectedOption.label,
            isCorrect: hasCorrectConfig ? true : null,
          }
        );
      } else {
        return {
          success: false,
          message: '选择错误',
          data: {
            selectedValue,
            selectedLabel: selectedOption.label,
            isCorrect: false,
            correctAnswer: correctOption ? { value: correctOption.value, label: correctOption.label } : undefined,
          },
        };
      }
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
    return 'SingleSelectUI';
  }
  
  getDescription(): string {
    return '展示多个选项供用户单选，可配置正确答案进行验证';
  }
}
