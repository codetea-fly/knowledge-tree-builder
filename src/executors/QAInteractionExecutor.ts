import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';

export class QAInteractionExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'qa_interaction';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始问答交互步骤');
    this.updateProgress(context, 0, '等待用户回答...');
    
    // 获取问题配置
    const question = config?.question || '请回答以下问题';
    
    // 如果没有用户输入，请求回答
    if (!context.userInput) {
      return this.createUserActionOutput('请回答问题', {
        type: 'text',
        title: question,
        description: config?.expectedAnswer ? '请根据要求作答' : undefined,
        required: true,
      });
    }
    
    this.updateProgress(context, 50, '正在验证答案...');
    
    try {
      // 验证答案
      const validationResult = await this.validateAnswer(
        String(context.userInput), 
        config
      );
      
      this.updateProgress(context, 100, '问答完成');
      
      if (validationResult.isValid) {
        this.log(context, 'info', '问答验证通过');
        return this.createSuccessOutput('回答验证通过', {
          question,
          answer: context.userInput,
          validationResult,
        });
      } else {
        this.log(context, 'warn', `问答验证未通过: ${validationResult.reason}`);
        return this.createErrorOutput(
          '回答未通过验证', 
          validationResult.reason
        );
      }
    } catch (error) {
      this.log(context, 'error', `问答处理失败: ${error}`);
      return this.createErrorOutput('问答处理失败', String(error));
    }
  }
  
  validateConfig(config: CheckItemConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.question || config.question.trim() === '') {
      errors.push('问题内容不能为空');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  getUIComponentName(): string {
    return 'QAInteractionUI';
  }
  
  getDescription(): string {
    return '与用户进行问答交互，收集和验证用户的文字回答';
  }
  
  // 私有方法：验证答案
  private async validateAnswer(
    answer: string, 
    config?: CheckItemConfig
  ): Promise<{ isValid: boolean; reason?: string; score?: number }> {
    // 模拟验证过程
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 如果配置了预期答案，进行匹配验证
    if (config?.expectedAnswer) {
      const isMatch = answer.toLowerCase().includes(
        config.expectedAnswer.toLowerCase()
      );
      return {
        isValid: isMatch,
        reason: isMatch ? undefined : '答案与预期不符',
        score: isMatch ? 100 : 0,
      };
    }
    
    // 如果没有预期答案，只要有内容就通过
    return {
      isValid: answer.trim().length > 0,
      reason: answer.trim().length === 0 ? '答案不能为空' : undefined,
      score: answer.trim().length > 0 ? 100 : 0,
    };
  }
}
