// 步骤执行API统一接口定义
// 所有后端接口都遵循这个规范，确保可扩展性和一致性

import { StepType } from './workflow';

// ==================== 基础请求/响应类型 ====================

// 统一的API响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

// API错误详情
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== 步骤执行API基础类型 ====================

// 步骤执行请求基类
export interface StepExecutionRequest {
  // 步骤类型
  stepType: StepType;
  // 步骤ID
  stepId: string;
  // 工作流ID
  workflowId: string;
  // 执行会话ID（用于追踪整个审核过程）
  sessionId: string;
  // 用户输入数据
  userInput?: unknown;
  // 上下文数据
  context?: Record<string, unknown>;
}

// 步骤执行响应基类
export interface StepExecutionResponse {
  // 执行是否成功
  success: boolean;
  // 结果消息
  message: string;
  // 执行结果数据
  data?: unknown;
  // 是否需要用户操作
  requiresUserAction?: boolean;
  // 用户操作配置
  userActionConfig?: UserActionConfig;
  // 执行日志
  logs?: ExecutionLog[];
  // 执行耗时（毫秒）
  duration?: number;
}

// 用户操作配置
export interface UserActionConfig {
  type: 'file' | 'text' | 'select' | 'multiselect' | 'confirm' | 'custom';
  title: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  validation?: ValidationRule[];
  customComponent?: string;
}

// 验证规则
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

// 执行日志
export interface ExecutionLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  data?: unknown;
}

// ==================== 文件解析API ====================

export interface FileParseRequest extends StepExecutionRequest {
  stepType: 'file_parse';
  // 文件信息
  file?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  };
  // 解析选项
  parseOptions?: {
    // 支持的格式
    format?: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt' | 'json' | 'xml';
    // 是否提取文本
    extractText?: boolean;
    // 是否提取表格
    extractTables?: boolean;
    // 是否提取图片
    extractImages?: boolean;
    // 是否进行OCR
    enableOcr?: boolean;
    // 页码范围
    pageRange?: { start: number; end: number };
  };
}

export interface FileParseResponse extends StepExecutionResponse {
  data?: {
    // 解析后的文本内容
    textContent?: string;
    // 提取的表格数据
    tables?: Array<{
      name: string;
      headers: string[];
      rows: string[][];
    }>;
    // 提取的图片
    images?: Array<{
      id: string;
      url: string;
      ocrText?: string;
    }>;
    // 文档元数据
    metadata?: {
      pageCount?: number;
      author?: string;
      createdAt?: string;
      modifiedAt?: string;
    };
    // 结构化数据（JSON/XML解析结果）
    structuredData?: unknown;
  };
}

// ==================== 问答交互API ====================

export interface QAInteractionRequest extends StepExecutionRequest {
  stepType: 'qa_interaction';
  // 用户回答
  answer?: string;
  // 问题配置
  questionConfig?: {
    question: string;
    expectedAnswer?: string;
    // 是否使用AI验证
    useAiValidation?: boolean;
    // AI验证提示词
    aiValidationPrompt?: string;
  };
}

export interface QAInteractionResponse extends StepExecutionResponse {
  data?: {
    question: string;
    answer: string;
    // 验证结果
    validation: {
      isValid: boolean;
      score?: number;
      feedback?: string;
      // AI分析结果
      aiAnalysis?: {
        relevance: number;
        accuracy: number;
        completeness: number;
        suggestions?: string[];
      };
    };
  };
}

// ==================== 单选API ====================

export interface SingleSelectRequest extends StepExecutionRequest {
  stepType: 'single_select';
  // 用户选择的值
  selectedValue?: string;
  // 选项配置
  optionsConfig?: {
    options: Array<{
      label: string;
      value: string;
      isCorrect?: boolean;
    }>;
    // 是否随机排序
    shuffle?: boolean;
  };
}

export interface SingleSelectResponse extends StepExecutionResponse {
  data?: {
    selectedValue: string;
    selectedLabel: string;
    isCorrect: boolean | null;
    correctAnswer?: {
      value: string;
      label: string;
    };
    explanation?: string;
  };
}

// ==================== 多选API ====================

export interface MultiSelectRequest extends StepExecutionRequest {
  stepType: 'multi_select';
  // 用户选择的值数组
  selectedValues?: string[];
  // 选项配置
  optionsConfig?: {
    options: Array<{
      label: string;
      value: string;
      isCorrect?: boolean;
    }>;
    // 最少选择数量
    minSelect?: number;
    // 最多选择数量
    maxSelect?: number;
    // 是否随机排序
    shuffle?: boolean;
  };
}

export interface MultiSelectResponse extends StepExecutionResponse {
  data?: {
    selectedValues: string[];
    selectedLabels: string[];
    score: number;
    isFullyCorrect: boolean | null;
    correctAnswers?: Array<{
      value: string;
      label: string;
    }>;
    // 详细评分
    scoreDetails?: {
      correctCount: number;
      incorrectCount: number;
      missedCount: number;
    };
    explanation?: string;
  };
}

// ==================== 脚本检查API ====================

export interface ScriptCheckRequest extends StepExecutionRequest {
  stepType: 'script_check';
  // 脚本内容
  script?: {
    content: string;
    language: 'javascript' | 'python' | 'sql';
  };
  // 执行参数
  executionParams?: {
    // 超时时间（毫秒）
    timeout?: number;
    // 内存限制（MB）
    memoryLimit?: number;
    // 环境变量
    env?: Record<string, string>;
    // 输入数据
    inputData?: unknown;
  };
}

export interface ScriptCheckResponse extends StepExecutionResponse {
  data?: {
    // 执行结果
    result: unknown;
    // 标准输出
    stdout?: string;
    // 标准错误
    stderr?: string;
    // 执行时间（毫秒）
    executionTime: number;
    // 内存使用（MB）
    memoryUsage?: number;
    // 检查是否通过
    passed: boolean;
    // 检查详情
    checkDetails?: Array<{
      name: string;
      passed: boolean;
      message?: string;
    }>;
  };
}

// ==================== 子流程API ====================

export interface SubWorkflowRequest extends StepExecutionRequest {
  stepType: 'sub_workflow';
  // 子流程ID
  subWorkflowId: string;
  // 子流程执行选项
  executionOptions?: {
    // 是否异步执行
    async?: boolean;
    // 超时时间
    timeout?: number;
    // 失败时是否继续
    continueOnFailure?: boolean;
  };
}

export interface SubWorkflowResponse extends StepExecutionResponse {
  data?: {
    // 子流程执行状态
    status: 'pending' | 'running' | 'completed' | 'failed';
    // 总步骤数
    totalSteps: number;
    // 已完成步骤数
    completedSteps: number;
    // 各步骤结果
    stepResults: Array<{
      stepId: string;
      stepName: string;
      success: boolean;
      message?: string;
    }>;
    // 整体结果
    overallResult?: {
      success: boolean;
      passedSteps: number;
      failedSteps: number;
    };
  };
}

// ==================== API端点配置 ====================

// API端点定义
export interface ApiEndpoint {
  // 请求方法
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  // 路径（相对于基础URL）
  path: string;
  // 描述
  description: string;
}

// 步骤类型对应的API端点映射
export const stepApiEndpoints: Record<StepType, ApiEndpoint> = {
  file_parse: {
    method: 'POST',
    path: '/api/steps/file-parse',
    description: '文件解析接口',
  },
  qa_interaction: {
    method: 'POST',
    path: '/api/steps/qa-interaction',
    description: '问答交互接口',
  },
  single_select: {
    method: 'POST',
    path: '/api/steps/single-select',
    description: '单选验证接口',
  },
  multi_select: {
    method: 'POST',
    path: '/api/steps/multi-select',
    description: '多选验证接口',
  },
  script_check: {
    method: 'POST',
    path: '/api/steps/script-check',
    description: '脚本执行检查接口',
  },
  sub_workflow: {
    method: 'POST',
    path: '/api/steps/sub-workflow',
    description: '子流程执行接口',
  },
};

// ==================== 类型映射工具 ====================

// 根据步骤类型获取对应的请求类型
export type StepRequestMap = {
  file_parse: FileParseRequest;
  qa_interaction: QAInteractionRequest;
  single_select: SingleSelectRequest;
  multi_select: MultiSelectRequest;
  script_check: ScriptCheckRequest;
  sub_workflow: SubWorkflowRequest;
};

// 根据步骤类型获取对应的响应类型
export type StepResponseMap = {
  file_parse: FileParseResponse;
  qa_interaction: QAInteractionResponse;
  single_select: SingleSelectResponse;
  multi_select: MultiSelectResponse;
  script_check: ScriptCheckResponse;
  sub_workflow: SubWorkflowResponse;
};

// 通用的步骤请求类型
export type AnyStepRequest = StepRequestMap[StepType];

// 通用的步骤响应类型
export type AnyStepResponse = StepResponseMap[StepType];
