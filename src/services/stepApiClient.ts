// 步骤执行API客户端
// 提供统一的接口调用方式，支持扩展自定义步骤类型

import { StepType } from '@/types/workflow';
import {
  ApiResponse,
  StepExecutionRequest,
  StepExecutionResponse,
  StepRequestMap,
  StepResponseMap,
  stepApiEndpoints,
  FileParseRequest,
  FileParseResponse,
  QAInteractionRequest,
  QAInteractionResponse,
  SingleSelectRequest,
  SingleSelectResponse,
  MultiSelectRequest,
  MultiSelectResponse,
  ScriptCheckRequest,
  ScriptCheckResponse,
  SubWorkflowRequest,
  SubWorkflowResponse,
} from '@/types/stepApi';

// ==================== API客户端配置 ====================

export interface ApiClientConfig {
  // 基础URL
  baseUrl: string;
  // 请求超时时间（毫秒）
  timeout: number;
  // 认证token
  authToken?: string;
  // 自定义请求头
  headers?: Record<string, string>;
  // 是否启用mock模式
  mockMode: boolean;
  // 重试次数
  retryCount: number;
  // 重试延迟（毫秒）
  retryDelay: number;
}

// 默认配置
const defaultConfig: ApiClientConfig = {
  baseUrl: '/api',
  timeout: 30000,
  mockMode: true, // 默认使用mock模式
  retryCount: 3,
  retryDelay: 1000,
};

// ==================== Mock处理器类型 ====================

export type MockHandler<TReq extends StepExecutionRequest, TRes extends StepExecutionResponse> = 
  (request: TReq) => Promise<ApiResponse<TRes>>;

// ==================== API客户端类 ====================

export class StepApiClient {
  private config: ApiClientConfig;
  private mockHandlers: Map<StepType, MockHandler<any, any>> = new Map();

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initDefaultMockHandlers();
  }

  // 更新配置
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 设置认证token
  setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  // ==================== 通用执行方法 ====================

  // 执行步骤（泛型方法）
  async executeStep<T extends StepType>(
    stepType: T,
    request: StepRequestMap[T]
  ): Promise<ApiResponse<StepResponseMap[T]>> {
    if (this.config.mockMode) {
      return this.executeMock(stepType, request);
    }
    return this.executeReal(stepType, request);
  }

  // ==================== 特定步骤类型的快捷方法 ====================

  async fileParse(request: Omit<FileParseRequest, 'stepType'>): Promise<ApiResponse<FileParseResponse>> {
    return this.executeStep('file_parse', { ...request, stepType: 'file_parse' });
  }

  async qaInteraction(request: Omit<QAInteractionRequest, 'stepType'>): Promise<ApiResponse<QAInteractionResponse>> {
    return this.executeStep('qa_interaction', { ...request, stepType: 'qa_interaction' });
  }

  async singleSelect(request: Omit<SingleSelectRequest, 'stepType'>): Promise<ApiResponse<SingleSelectResponse>> {
    return this.executeStep('single_select', { ...request, stepType: 'single_select' });
  }

  async multiSelect(request: Omit<MultiSelectRequest, 'stepType'>): Promise<ApiResponse<MultiSelectResponse>> {
    return this.executeStep('multi_select', { ...request, stepType: 'multi_select' });
  }

  async scriptCheck(request: Omit<ScriptCheckRequest, 'stepType'>): Promise<ApiResponse<ScriptCheckResponse>> {
    return this.executeStep('script_check', { ...request, stepType: 'script_check' });
  }

  async subWorkflow(request: Omit<SubWorkflowRequest, 'stepType'>): Promise<ApiResponse<SubWorkflowResponse>> {
    return this.executeStep('sub_workflow', { ...request, stepType: 'sub_workflow' });
  }

  // ==================== Mock处理器注册 ====================

  // 注册自定义mock处理器
  registerMockHandler<T extends StepType>(
    stepType: T,
    handler: MockHandler<StepRequestMap[T], StepResponseMap[T]>
  ): void {
    this.mockHandlers.set(stepType, handler);
  }

  // ==================== 私有方法 ====================

  // 真实API调用
  private async executeReal<T extends StepType>(
    stepType: T,
    request: StepRequestMap[T]
  ): Promise<ApiResponse<StepResponseMap[T]>> {
    const endpoint = stepApiEndpoints[stepType];
    const url = `${this.config.baseUrl}${endpoint.path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: endpoint.method,
          headers,
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data as ApiResponse<StepResponseMap[T]>;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    return this.createErrorResponse(
      'API_ERROR',
      lastError?.message || '请求失败'
    );
  }

  // Mock执行
  private async executeMock<T extends StepType>(
    stepType: T,
    request: StepRequestMap[T]
  ): Promise<ApiResponse<StepResponseMap[T]>> {
    const handler = this.mockHandlers.get(stepType);
    if (handler) {
      // 模拟网络延迟
      await this.delay(500 + Math.random() * 500);
      return handler(request);
    }
    return this.createErrorResponse('NOT_IMPLEMENTED', `步骤类型 ${stepType} 未实现mock处理器`);
  }

  // 初始化默认mock处理器
  private initDefaultMockHandlers(): void {
    // 文件解析mock
    this.registerMockHandler('file_parse', async (request: FileParseRequest) => {
      if (!request.file) {
        return this.createResponse<FileParseResponse>(false, '请上传文件', undefined, {
          requiresUserAction: true,
          userActionConfig: {
            type: 'file',
            title: '上传文件',
            description: '请选择要解析的文件',
            required: true,
          },
        });
      }

      return this.createResponse<FileParseResponse>(true, '文件解析成功', {
        data: {
          textContent: `这是从 ${request.file.name} 解析出的文本内容...`,
          metadata: {
            pageCount: 10,
            author: '系统用户',
            createdAt: new Date().toISOString(),
          },
        },
      });
    });

    // 问答交互mock
    this.registerMockHandler('qa_interaction', async (request: QAInteractionRequest) => {
      if (!request.answer) {
        return this.createResponse<QAInteractionResponse>(false, '请回答问题', undefined, {
          requiresUserAction: true,
          userActionConfig: {
            type: 'text',
            title: request.questionConfig?.question || '请回答问题',
            required: true,
          },
        });
      }

      const isValid = request.questionConfig?.expectedAnswer
        ? request.answer.toLowerCase().includes(request.questionConfig.expectedAnswer.toLowerCase())
        : request.answer.trim().length > 0;

      return this.createResponse<QAInteractionResponse>(isValid, isValid ? '回答正确' : '回答不正确', {
        data: {
          question: request.questionConfig?.question || '',
          answer: request.answer,
          validation: {
            isValid,
            score: isValid ? 100 : 0,
            feedback: isValid ? '回答符合预期' : '答案与预期不符',
          },
        },
      });
    });

    // 单选mock
    this.registerMockHandler('single_select', async (request: SingleSelectRequest) => {
      if (!request.selectedValue) {
        return this.createResponse<SingleSelectResponse>(false, '请选择一个选项', undefined, {
          requiresUserAction: true,
          userActionConfig: {
            type: 'select',
            title: '请选择',
            options: request.optionsConfig?.options.map(o => ({ label: o.label, value: o.value })),
            required: true,
          },
        });
      }

      const selectedOption = request.optionsConfig?.options.find(o => o.value === request.selectedValue);
      const isCorrect = selectedOption?.isCorrect ?? null;

      return this.createResponse<SingleSelectResponse>(
        isCorrect !== false,
        isCorrect ? '选择正确' : (isCorrect === null ? '已选择' : '选择错误'),
        {
          data: {
            selectedValue: request.selectedValue,
            selectedLabel: selectedOption?.label || '',
            isCorrect,
          },
        }
      );
    });

    // 多选mock
    this.registerMockHandler('multi_select', async (request: MultiSelectRequest) => {
      if (!request.selectedValues || request.selectedValues.length === 0) {
        return this.createResponse<MultiSelectResponse>(false, '请选择选项', undefined, {
          requiresUserAction: true,
          userActionConfig: {
            type: 'multiselect',
            title: '请选择（可多选）',
            options: request.optionsConfig?.options.map(o => ({ label: o.label, value: o.value })),
            required: true,
          },
        });
      }

      const correctOptions = request.optionsConfig?.options.filter(o => o.isCorrect) || [];
      const selectedSet = new Set(request.selectedValues);
      const correctSelected = correctOptions.filter(o => selectedSet.has(o.value)).length;
      const incorrectSelected = request.selectedValues.filter(
        v => !correctOptions.some(o => o.value === v)
      ).length;
      
      const score = correctOptions.length > 0
        ? Math.max(0, Math.round((correctSelected / correctOptions.length) * 100 - incorrectSelected * 20))
        : 100;

      return this.createResponse<MultiSelectResponse>(score >= 60, `得分: ${score}`, {
        data: {
          selectedValues: request.selectedValues,
          selectedLabels: request.selectedValues.map(
            v => request.optionsConfig?.options.find(o => o.value === v)?.label || ''
          ),
          score,
          isFullyCorrect: score === 100,
          scoreDetails: {
            correctCount: correctSelected,
            incorrectCount: incorrectSelected,
            missedCount: correctOptions.length - correctSelected,
          },
        },
      });
    });

    // 脚本检查mock
    this.registerMockHandler('script_check', async (request: ScriptCheckRequest) => {
      if (!request.script?.content) {
        return this.createResponse<ScriptCheckResponse>(false, '脚本内容为空');
      }

      // 模拟脚本执行
      const executionTime = 100 + Math.random() * 400;
      const passed = Math.random() > 0.2; // 80%通过率

      return this.createResponse<ScriptCheckResponse>(passed, passed ? '脚本检查通过' : '脚本检查未通过', {
        data: {
          result: { success: passed },
          stdout: '执行输出...',
          executionTime,
          passed,
          checkDetails: [
            { name: '语法检查', passed: true },
            { name: '逻辑验证', passed },
          ],
        },
      });
    });

    // 子流程mock
    this.registerMockHandler('sub_workflow', async (request: SubWorkflowRequest) => {
      return this.createResponse<SubWorkflowResponse>(true, '子流程执行完成', {
        data: {
          status: 'completed',
          totalSteps: 3,
          completedSteps: 3,
          stepResults: [
            { stepId: '1', stepName: '步骤1', success: true },
            { stepId: '2', stepName: '步骤2', success: true },
            { stepId: '3', stepName: '步骤3', success: true },
          ],
          overallResult: {
            success: true,
            passedSteps: 3,
            failedSteps: 0,
          },
        },
      });
    });
  }

  // 创建响应
  private createResponse<T extends StepExecutionResponse>(
    success: boolean,
    message: string,
    responseData?: Partial<T>,
    additionalFields?: Partial<T>
  ): ApiResponse<T> {
    return {
      success,
      code: success ? 200 : 400,
      message,
      data: {
        success,
        message,
        ...responseData,
        ...additionalFields,
      } as T,
      timestamp: Date.now(),
    };
  }

  // 创建错误响应
  private createErrorResponse<T>(code: string, message: string): ApiResponse<T> {
    return {
      success: false,
      code: 500,
      message,
      error: { code, message },
      timestamp: Date.now(),
    };
  }

  // 延迟工具
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 导出单例实例 ====================

export const stepApiClient = new StepApiClient();

// ==================== 扩展接口 ====================

/**
 * 扩展新的步骤类型API示例：
 * 
 * 1. 在 stepApi.ts 中定义新的请求/响应类型：
 * 
 * ```typescript
 * export interface CustomCheckRequest extends StepExecutionRequest {
 *   stepType: 'custom_check';
 *   customData: { ... };
 * }
 * 
 * export interface CustomCheckResponse extends StepExecutionResponse {
 *   data?: { ... };
 * }
 * ```
 * 
 * 2. 更新类型映射：
 * 
 * ```typescript
 * export type StepRequestMap = {
 *   ...
 *   custom_check: CustomCheckRequest;
 * };
 * ```
 * 
 * 3. 注册mock处理器：
 * 
 * ```typescript
 * stepApiClient.registerMockHandler('custom_check', async (request) => {
 *   // 实现mock逻辑
 *   return { success: true, ... };
 * });
 * ```
 * 
 * 4. 添加快捷方法（可选）：
 * 
 * ```typescript
 * // 扩展StepApiClient类
 * async customCheck(request: Omit<CustomCheckRequest, 'stepType'>) {
 *   return this.executeStep('custom_check', { ...request, stepType: 'custom_check' });
 * }
 * ```
 */
