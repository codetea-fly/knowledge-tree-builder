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
    
    // 解析用户输入（UI提交的是对象 { answer, submittedAt }）
    const userInput = context.userInput as { answer?: string } | string | unknown;
    const answer = typeof userInput === 'string'
      ? userInput
      : (userInput as { answer?: string })?.answer || String(userInput);
    
    apiRequest.answer = answer;
    
    this.updateProgress(context, 50, '正在验证答案...');
    
    let useLocalValidation = false;
    
    try {
      // 调用后端API
      const response = await stepApiClient.qaInteraction(apiRequest);
      
      if (response.success && response.data?.success) {
        this.updateProgress(context, 100, '问答完成');
        this.log(context, 'info', '问答验证通过');
        return this.createSuccessOutput('回答验证通过', response.data.data);
      } else if (response.data) {
        if (response.data.requiresUserAction) {
          return {
            success: false,
            message: response.data.message,
            requiresUserAction: true,
            userActionConfig: response.data.userActionConfig,
          };
        }
        this.updateProgress(context, 100, '问答完成');
        this.log(context, 'warn', `问答验证未通过: ${response.message}`);
        return this.createErrorOutput(response.data.message || '回答未通过验证', response.message);
      } else {
        useLocalValidation = true;
      }
    } catch (error) {
      useLocalValidation = true;
      this.log(context, 'warn', `API调用异常，使用本地验证: ${error}`);
    }
    
    // 本地验证降级
    if (useLocalValidation) {
      this.log(context, 'info', '使用本地验证');
      
      const expectedAnswer = config?.expectedAnswer?.trim();
      const trimmedAnswer = answer.trim();
      
      if (!trimmedAnswer) {
        return this.createErrorOutput('回答为空', '请输入您的回答');
      }
      
      // 如果配置了预期答案，进行匹配验证
      if (expectedAnswer) {
        // 不区分大小写的包含匹配
        const isCorrect = trimmedAnswer.toLowerCase().includes(expectedAnswer.toLowerCase())
          || expectedAnswer.toLowerCase().includes(trimmedAnswer.toLowerCase());
        
        this.updateProgress(context, 100, '问答完成');
        
        if (isCorrect) {
          return this.createSuccessOutput('回答正确', {
            question,
            answer: trimmedAnswer,
            isCorrect: true,
          });
        } else {
          return {
            success: false,
            message: '回答不正确',
            data: {
              question,
              answer: trimmedAnswer,
              isCorrect: false,
              expectedAnswer,
            },
          };
        }
      }
      
      // 没有预期答案，仅收集回答
      this.updateProgress(context, 100, '问答完成');
      return this.createSuccessOutput('已收到回答', {
        question,
        answer: trimmedAnswer,
        isCorrect: null,
      });
    }
    
    return this.createErrorOutput('未知错误', '验证流程异常');
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
