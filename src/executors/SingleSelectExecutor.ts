import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';

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
    
    this.updateProgress(context, 50, '正在验证选择...');
    
    try {
      const selectedValue = String(context.userInput);
      const selectedOption = options.find(opt => opt.value === selectedValue);
      
      if (!selectedOption) {
        return this.createErrorOutput('无效选择', '所选选项不存在');
      }
      
      this.updateProgress(context, 100, '选择完成');
      
      // 检查是否选择了正确答案
      const isCorrect = selectedOption.isCorrect === true;
      
      if (isCorrect) {
        this.log(context, 'info', `选择正确: ${selectedOption.label}`);
        return this.createSuccessOutput('选择正确', {
          selectedValue,
          selectedLabel: selectedOption.label,
          isCorrect: true,
        });
      } else {
        // 如果有正确答案配置，选错则失败
        const hasCorrectAnswer = options.some(opt => opt.isCorrect);
        if (hasCorrectAnswer) {
          this.log(context, 'warn', `选择错误: ${selectedOption.label}`);
          return this.createErrorOutput('选择错误', `您选择了 "${selectedOption.label}"，这不是正确答案`);
        }
        
        // 没有正确答案配置，任何选择都算通过
        this.log(context, 'info', `已选择: ${selectedOption.label}`);
        return this.createSuccessOutput('选择完成', {
          selectedValue,
          selectedLabel: selectedOption.label,
          isCorrect: null,
        });
      }
    } catch (error) {
      this.log(context, 'error', `单选处理失败: ${error}`);
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
    return 'SingleSelectUI';
  }
  
  getDescription(): string {
    return '展示多个选项供用户单选，可配置正确答案进行验证';
  }
}
