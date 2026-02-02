import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';
import { stepApiClient } from '@/services/stepApiClient';
import { QAInteractionRequest } from '@/types/stepApi';

export class QAInteractionExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'qa_interaction';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始问答交互步骤');
    this.updateProgress(context, 0, '等待用户回答...');
    
    // 获取问题配置
    const question = config?.question || '请回答以下问题';
    
    // 构建API请求
    const apiRequest: Omit<QAInteractionRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
      questionConfig: {
        question,
        expectedAnswer: config?.expectedAnswer,
        useAiValidation: config?.useAiValidation,
        aiValidationPrompt: config?.aiValidationPrompt,
      },
    };
    
    // 如果没有用户输入，请求回答
    if (!context.userInput) {
      return this.createUserActionOutput('请回答问题', {
        type: 'text',
        title: question,
        description: config?.expectedAnswer ? '请根据要求作答' : undefined,
        required: true,
      });
    }
    
    // 添加用户答案
    apiRequest.answer = String(context.userInput);
    
    this.updateProgress(context, 50, '正在验证答案...');
    
    try {
      // 调用后端API
      const response = await stepApiClient.qaInteraction(apiRequest);
      
      this.updateProgress(context, 100, '问答完成');
      
      if (response.success && response.data?.success) {
        this.log(context, 'info', '问答验证通过');
        return this.createSuccessOutput('回答验证通过', response.data.data);
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
        
        this.log(context, 'warn', `问答验证未通过: ${response.message}`);
        return this.createErrorOutput('回答未通过验证', response.message);
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
}
