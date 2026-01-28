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
  
  // 单选/多选配置
  options?: { label: string; value: string; isCorrect?: boolean }[];
  
  // 脚本检查配置
  scriptContent?: string;
  scriptLanguage?: 'javascript' | 'python';
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

// 示例流程库
export const defaultWorkflowLibrary: WorkflowLibrary = {
  workflows: [
    {
      id: 'workflow-1',
      name: 'ISO 9001 合规性审核',
      description: '针对ISO 9001质量管理体系的标准合规性审核流程',
      enabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      steps: [
        {
          id: 'step-1-1',
          name: '文档完整性检查',
          description: '检查质量管理文档的完整性',
          stepType: 'file_parse',
          required: true,
          checkConfig: {
            fileTypes: ['pdf', 'docx'],
            parseRules: '检查文档结构和必要章节',
          },
        },
        {
          id: 'step-1-2',
          name: '管理职责确认',
          description: '确认管理层职责分配',
          stepType: 'single_select',
          required: true,
          checkConfig: {
            options: [
              { label: '已明确分配', value: 'yes', isCorrect: true },
              { label: '部分分配', value: 'partial' },
              { label: '未分配', value: 'no' },
            ],
          },
        },
        {
          id: 'step-1-3',
          name: '过程控制评估',
          description: '评估过程控制措施的有效性',
          stepType: 'qa_interaction',
          required: true,
          checkConfig: {
            question: '请描述主要业务过程的控制措施',
          },
        },
      ],
    },
    {
      id: 'workflow-2',
      name: 'GJB 9001C 军工审核',
      description: 'GJB 9001C 军工质量管理体系审核流程',
      enabled: true,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-10T00:00:00Z',
      steps: [
        {
          id: 'step-2-1',
          name: '保密性检查',
          description: '检查保密管理制度',
          stepType: 'multi_select',
          required: true,
          checkConfig: {
            options: [
              { label: '保密责任制', value: 'responsibility', isCorrect: true },
              { label: '保密培训记录', value: 'training', isCorrect: true },
              { label: '涉密人员管理', value: 'personnel', isCorrect: true },
              { label: '物理安全措施', value: 'physical' },
            ],
          },
        },
        {
          id: 'step-2-2',
          name: '配置管理审核',
          description: '产品配置管理流程审核',
          stepType: 'script_check',
          required: true,
          checkConfig: {
            scriptContent: '// 检查配置管理脚本\nreturn true;',
            scriptLanguage: 'javascript',
          },
        },
      ],
    },
    {
      id: 'workflow-3',
      name: '供应商评估子流程',
      description: '供应商质量能力评估',
      enabled: true,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-05T00:00:00Z',
      steps: [
        {
          id: 'step-3-1',
          name: '资质审查',
          description: '审查供应商资质证书',
          stepType: 'file_parse',
          required: true,
          checkConfig: {
            fileTypes: ['pdf', 'jpg', 'png'],
          },
        },
        {
          id: 'step-3-2',
          name: '能力评分',
          description: '对供应商能力进行评分',
          stepType: 'single_select',
          required: true,
          checkConfig: {
            options: [
              { label: '优秀 (90-100)', value: 'excellent', isCorrect: true },
              { label: '良好 (70-89)', value: 'good', isCorrect: true },
              { label: '合格 (60-69)', value: 'pass' },
              { label: '不合格 (<60)', value: 'fail' },
            ],
          },
        },
      ],
    },
  ],
};
