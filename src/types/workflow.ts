// 步骤类型
export type StepType = 
  | 'file_parse'      // 文件解析
  | 'qa_interaction'  // 问答交互
  | 'single_select'   // 单选选择
  | 'multi_select'    // 多选选择
  | 'script_check'    // 脚本检查
  | 'sub_workflow';   // 子流程

export interface StepTypeInfo {
  type: StepType;
  label: string;
  description: string;
  icon: string;
}

export const STEP_TYPES: StepTypeInfo[] = [
  { type: 'file_parse', label: '文件解析', description: '解析上传的文件内容', icon: 'FileText' },
  { type: 'qa_interaction', label: '问答交互', description: '与用户进行问答交互', icon: 'MessageSquare' },
  { type: 'single_select', label: '单选选择', description: '用户从选项中选择一个答案', icon: 'CircleDot' },
  { type: 'multi_select', label: '多选选择', description: '用户从选项中选择多个答案', icon: 'CheckSquare' },
  { type: 'script_check', label: '脚本检查', description: '运行自定义脚本进行检查', icon: 'Code' },
  { type: 'sub_workflow', label: '子流程', description: '引用其他审核流程', icon: 'GitBranch' },
];

// 步骤类型标签映射
export const stepTypeLabels: Record<StepType, string> = {
  file_parse: '文件解析',
  qa_interaction: '问答交互',
  single_select: '单选',
  multi_select: '多选',
  script_check: '脚本',
  sub_workflow: '子流程',
};

// 检查项配置
export interface CheckItemConfig {
  // 文件解析配置
  fileTypes?: string[];
  parseRules?: string;
  
  // 问答交互配置
  question?: string;
  expectedAnswer?: string;
  useAiValidation?: boolean;
  aiValidationPrompt?: string;
  
  // 单选/多选配置
  options?: { label: string; value: string; isCorrect?: boolean }[];
  shuffleOptions?: boolean;
  minSelect?: number;
  maxSelect?: number;
  
  // 脚本检查配置
  scriptContent?: string;
  scriptLanguage?: 'javascript' | 'python' | 'sql';
  scriptTimeout?: number;
  memoryLimit?: number;
}

// 子流程配置
export interface SubWorkflowConfig {
  workflowId: string;
  workflowName: string;
}

// 流程步骤
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  stepType: StepType;
  required: boolean;
  // 检查项配置（仅当stepType不是sub_workflow时使用）
  checkConfig?: CheckItemConfig;
  // 子流程配置（仅当stepType是sub_workflow时使用）
  subWorkflowConfig?: SubWorkflowConfig;
  // 子步骤（树形结构支持）
  children?: WorkflowStep[];
}

// 审核流程
export interface ReviewWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStep[];
}

// 流程库
export interface WorkflowLibrary {
  workflows: ReviewWorkflow[];
}

// 审核执行状态
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface StepExecutionResult {
  stepId: string;
  stepName: string;
  stepType: StepType;
  status: StepStatus;
  message?: string;
  startTime?: string;
  endTime?: string;
  // 子流程执行结果
  subWorkflowResults?: StepExecutionResult[];
}

export interface ReviewExecutionResult {
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  stepResults: StepExecutionResult[];
  overallSuccess: boolean;
  failedSteps: string[];
}

// 生成唯一ID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 默认流程
export const createDefaultWorkflow = (): ReviewWorkflow => ({
  id: generateId(),
  name: '新审核流程',
  description: '',
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [],
});

// 默认步骤
export const createDefaultStep = (stepType: StepType): WorkflowStep => ({
  id: generateId(),
  name: STEP_TYPES.find(t => t.type === stepType)?.label || '新步骤',
  description: '',
  stepType,
  required: true,
  checkConfig: stepType !== 'sub_workflow' ? {} : undefined,
  subWorkflowConfig: stepType === 'sub_workflow' ? { workflowId: '', workflowName: '' } : undefined,
});

// 默认空流程库（无示例数据）
export const defaultWorkflowLibrary: WorkflowLibrary = {
  workflows: [],
};
