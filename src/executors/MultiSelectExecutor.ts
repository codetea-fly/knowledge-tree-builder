import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';

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
    
    this.updateProgress(context, 50, '正在验证选择...');
    
    try {
      // 用户输入应该是选中值的数组
      const selectedValues = Array.isArray(context.userInput) 
        ? context.userInput.map(String)
        : [String(context.userInput)];
      
      // 验证所有选择的有效性
      const selectedOptions = selectedValues.map(val => 
        options.find(opt => opt.value === val)
      ).filter(Boolean);
      
      if (selectedOptions.length !== selectedValues.length) {
        return this.createErrorOutput('无效选择', '部分所选选项不存在');
      }
      
      if (selectedOptions.length === 0) {
        return this.createErrorOutput('未选择', '请至少选择一个选项');
      }
      
      this.updateProgress(context, 100, '选择完成');
      
      // 检查正确答案
      const correctOptions = options.filter(opt => opt.isCorrect);
      const hasCorrectAnswers = correctOptions.length > 0;
      
      if (hasCorrectAnswers) {
        // 计算得分
        const correctValues = new Set(correctOptions.map(opt => opt.value));
        const selectedSet = new Set(selectedValues);
        
        // 计算正确选中的数量
        const correctSelected = selectedValues.filter(v => correctValues.has(v)).length;
        // 计算错误选中的数量
        const incorrectSelected = selectedValues.filter(v => !correctValues.has(v)).length;
        // 计算遗漏的正确选项数量
        const missedCorrect = correctOptions.filter(opt => !selectedSet.has(opt.value)).length;
        
        const isFullyCorrect = correctSelected === correctOptions.length && incorrectSelected === 0;
        
        if (isFullyCorrect) {
          this.log(context, 'info', '多选完全正确');
          return this.createSuccessOutput('选择完全正确', {
            selectedValues,
            selectedLabels: selectedOptions.map(opt => opt!.label),
            score: 100,
            isFullyCorrect: true,
          });
        } else {
          const score = Math.max(0, 
            Math.round((correctSelected / correctOptions.length) * 100 - incorrectSelected * 20)
          );
          
          this.log(context, 'warn', `多选部分正确，得分: ${score}`);
          return this.createErrorOutput(
            '选择不完全正确',
            `正确选中 ${correctSelected} 项，错误选中 ${incorrectSelected} 项，遗漏 ${missedCorrect} 项`
          );
        }
      }
      
      // 没有正确答案配置，任何选择都算通过
      this.log(context, 'info', `已选择 ${selectedOptions.length} 项`);
      return this.createSuccessOutput('选择完成', {
        selectedValues,
        selectedLabels: selectedOptions.map(opt => opt!.label),
        isFullyCorrect: null,
      });
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
