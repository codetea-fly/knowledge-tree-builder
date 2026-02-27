import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType, QAQuestionItem } from '@/types/workflow';
import { stepApiClient } from '@/services/stepApiClient';
import { QAInteractionRequest, QARoundRecord } from '@/types/stepApi';

export class QAInteractionExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'qa_interaction';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    const qaQuestions = config?.qaQuestions || [];
    const useMultiRound = qaQuestions.length > 0;
    
    this.log(context, 'info', '开始问答交互步骤');
    this.updateProgress(context, 0, '等待用户回答...');
    
    // 如果没有用户输入，请求回答
    if (!context.userInput) {
      const question = useMultiRound
        ? qaQuestions[0]?.question || '请回答以下问题'
        : config?.question || '请回答以下问题';
        
      return this.createUserActionOutput('请回答问题', {
        type: 'text',
        title: question,
        description: config?.expectedAnswer ? '请根据要求作答' : undefined,
        required: true,
      });
    }
    
    // 解析用户输入
    const userInput = context.userInput as Record<string, unknown>;
    
    // 多轮问答：处理单轮提交（请求追问）
    if (userInput.type === 'qa_round') {
      return this.handleQARound(context, userInput);
    }
    
    // 多轮问答：所有问题完成
    if (userInput.type === 'qa_complete') {
      return this.handleQAComplete(context, userInput);
    }
    
    // 单题模式兼容
    return this.handleSingleQuestion(context, userInput);
  }
  
  private async handleSingleQuestion(
    context: StepExecutionContext,
    userInput: Record<string, unknown>
  ): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    const question = config?.question || '请回答以下问题';
    const answer = typeof userInput === 'string'
      ? userInput
      : (userInput.answer as string) || String(userInput);
    
    this.updateProgress(context, 50, '正在验证答案...');
    
    // 构建API请求
    const apiRequest: Omit<QAInteractionRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
      answer,
      questionConfig: {
        question,
        expectedAnswer: config?.expectedAnswer,
        useAiValidation: config?.useAiValidation,
        aiValidationPrompt: config?.aiValidationPrompt,
      },
    };
    
    let useLocalValidation = false;
    
    try {
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
      return this.localValidateSingle(context, question, answer, config?.expectedAnswer);
    }
    
    return this.createErrorOutput('未知错误', '验证流程异常');
  }
  
  private async handleQARound(
    context: StepExecutionContext,
    userInput: Record<string, unknown>
  ): Promise<StepExecutionOutput> {
    const answer = userInput.answer as string;
    const qaHistory = userInput.qaHistory as QARoundRecord[];
    const currentQuestionId = userInput.currentQuestionId as string;
    const requestFollowUp = userInput.requestFollowUp as boolean;
    const followUpPrompt = userInput.followUpPrompt as string | undefined;
    const useAiValidation = userInput.useAiValidation as boolean;
    const allQuestions = userInput.allQuestions as QAQuestionItem[];
    const currentQuestionIndex = userInput.currentQuestionIndex as number;
    const followUpCount = userInput.followUpCount as number;
    
    const currentQuestion = allQuestions?.find(q => q.id === currentQuestionId);
    
    this.updateProgress(context, 30, '正在验证回答...');
    
    // 构建API请求
    const apiRequest: Omit<QAInteractionRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
      answer,
      currentQuestionId,
      qaHistory,
      requestFollowUp: requestFollowUp,
      followUpPrompt,
      questionConfig: {
        question: currentQuestion?.question || '',
        expectedAnswer: currentQuestion?.expectedAnswer,
        useAiValidation,
        aiValidationPrompt: context.step.checkConfig?.aiValidationPrompt,
      },
    };
    
    try {
      const response = await stepApiClient.qaInteraction(apiRequest);
      
      if (response.success && response.data?.success) {
        const data = response.data.data;
        
        // 如果后端返回追问
        if (data?.needsFollowUp && data?.followUpQuestion) {
          this.updateProgress(context, 50, 'AI正在追问...');
          // 需要继续等待用户输入（追问场景）
          return this.createUserActionOutput(data.followUpQuestion, {
            type: 'text',
            title: data.followUpQuestion,
            description: '请根据追问内容补充回答',
            required: true,
            customComponent: 'followUp',
          });
        }
        
        this.updateProgress(context, 70, '验证通过，继续下一题...');
        this.log(context, 'info', `第${currentQuestionIndex + 1}题验证通过`);
        
        // 本轮验证通过，返回继续状态
        return this.createSuccessOutput('回答验证通过', {
          qaHistory,
          currentQuestionIndex,
          validation: data?.validation,
          continueToNext: true,
        });
      } else if (response.data) {
        return this.createErrorOutput(
          response.data.message || '回答验证未通过',
          response.message
        );
      }
    } catch (error) {
      this.log(context, 'warn', `API调用异常，使用本地验证: ${error}`);
    }
    
    // 本地验证降级
    const expectedAnswer = currentQuestion?.expectedAnswer;
    const localResult = this.localValidateAnswer(answer, expectedAnswer);
    
    this.updateProgress(context, 70, '本地验证完成');
    
    if (localResult.isValid || !expectedAnswer) {
      return this.createSuccessOutput(
        expectedAnswer ? '回答正确' : '已收到回答',
        {
          qaHistory,
          currentQuestionIndex,
          validation: localResult,
          continueToNext: true,
        }
      );
    } else {
      return {
        success: false,
        message: '回答不正确',
        data: {
          qaHistory,
          currentQuestionIndex,
          validation: localResult,
          expectedAnswer,
        },
      };
    }
  }
  
  private async handleQAComplete(
    context: StepExecutionContext,
    userInput: Record<string, unknown>
  ): Promise<StepExecutionOutput> {
    const qaHistory = userInput.qaHistory as QARoundRecord[];
    const allQuestions = userInput.allQuestions as QAQuestionItem[];
    const useAiValidation = userInput.useAiValidation as boolean;
    
    this.updateProgress(context, 80, '正在进行最终验证...');
    
    // 构建最终验证API请求
    const apiRequest: Omit<QAInteractionRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
      qaHistory,
      questionConfig: {
        question: '多轮问答总结验证',
        useAiValidation,
        aiValidationPrompt: context.step.checkConfig?.aiValidationPrompt,
      },
    };
    
    try {
      const response = await stepApiClient.qaInteraction(apiRequest);
      
      if (response.success && response.data?.success) {
        this.updateProgress(context, 100, '问答完成');
        this.log(context, 'info', '多轮问答验证通过');
        return this.createSuccessOutput('所有问题验证通过', {
          qaHistory,
          totalQuestions: allQuestions?.length || qaHistory.length,
          validation: response.data.data?.validation,
        });
      } else if (response.data) {
        this.updateProgress(context, 100, '问答完成');
        return this.createErrorOutput(
          response.data.message || '部分回答未通过验证',
          response.message
        );
      }
    } catch (error) {
      this.log(context, 'warn', `API调用异常，使用本地验证: ${error}`);
    }
    
    // 本地验证降级：逐题检验
    let allPassed = true;
    const results: Array<{ questionId: string; isValid: boolean }> = [];
    
    for (const record of qaHistory) {
      const question = allQuestions?.find(q => q.id === record.questionId);
      const result = this.localValidateAnswer(record.answer, question?.expectedAnswer);
      results.push({ questionId: record.questionId, isValid: result.isValid });
      if (!result.isValid && question?.expectedAnswer) {
        allPassed = false;
      }
    }
    
    this.updateProgress(context, 100, '问答完成');
    
    if (allPassed) {
      return this.createSuccessOutput('所有问题验证通过', {
        qaHistory,
        totalQuestions: allQuestions?.length || qaHistory.length,
        results,
      });
    } else {
      const failedCount = results.filter(r => !r.isValid).length;
      return {
        success: false,
        message: `${failedCount} 个问题回答不正确`,
        data: {
          qaHistory,
          totalQuestions: allQuestions?.length || qaHistory.length,
          results,
        },
      };
    }
  }
  
  private localValidateSingle(
    context: StepExecutionContext,
    question: string,
    answer: string,
    expectedAnswer?: string
  ): StepExecutionOutput {
    const trimmedAnswer = answer.trim();
    
    if (!trimmedAnswer) {
      return this.createErrorOutput('回答为空', '请输入您的回答');
    }
    
    if (expectedAnswer) {
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
    
    this.updateProgress(context, 100, '问答完成');
    return this.createSuccessOutput('已收到回答', {
      question,
      answer: trimmedAnswer,
      isCorrect: null,
    });
  }
  
  private localValidateAnswer(answer: string, expectedAnswer?: string): { isValid: boolean; feedback?: string } {
    if (!expectedAnswer) {
      return { isValid: true, feedback: '已收到回答' };
    }
    
    const trimmed = answer.trim().toLowerCase();
    const expected = expectedAnswer.trim().toLowerCase();
    
    const isValid = trimmed.includes(expected) || expected.includes(trimmed);
    
    return {
      isValid,
      feedback: isValid ? '回答符合预期' : '回答与预期不符',
    };
  }
  
  validateConfig(config: CheckItemConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const qaQuestions = config.qaQuestions || [];
    
    if (qaQuestions.length === 0) {
      // 单题模式
      if (!config.question || config.question.trim() === '') {
        errors.push('问题内容不能为空（请添加问题列表或填写单题问题）');
      }
    } else {
      // 多轮模式
      qaQuestions.forEach((q, idx) => {
        if (!q.question || q.question.trim() === '') {
          errors.push(`第${idx + 1}个问题内容不能为空`);
        }
      });
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  getUIComponentName(): string {
    return 'QAInteractionUI';
  }
  
  getDescription(): string {
    return '与用户进行问答交互，支持多轮问答和AI动态追问，收集和验证用户的文字回答';
  }
}
