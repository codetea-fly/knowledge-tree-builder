// 审查流程配置器类型定义

// 检查项类别
export type CheckCategory = 
  | 'basic-compliance'      // 基础合规性校验
  | 'file-content'          // 文件内容校验
  | 'file-reference'        // 文件参照性
  | 'keyword-check'         // 关键字校验
  | 'change-record'         // 变更记录审查
  | 'signature-check';      // 签字情况

// 交互方式类别
export type InteractionType = 
  | 'file-parse'            // 文件解析
  | 'qa-interaction'        // 问答交互
  | 'option-select'         // 选项选择
  | 'sub-process'           // 子流程
  | 'script-check';         // 脚本检查

// 流程阶段
export type WorkflowStage = 
  | 'preparation'           // 准备阶段
  | 'initial-review'        // 初审阶段
  | 'detailed-review'       // 详审阶段
  | 'approval'              // 审批阶段
  | 'completion';           // 完成阶段

// 节点类型
export type NodeType = 'check-category' | 'interaction';

// 流程节点数据 - 使用 index signature 兼容 React Flow
export interface WorkflowNodeData {
  [key: string]: unknown;
  label: string;
  description?: string;
  nodeType: NodeType;
  category?: CheckCategory;
  interactionType?: InteractionType;
  stage?: WorkflowStage;
  color: string;
  icon?: string;
  // 检查项专用配置
  validationRule?: string;
  referenceDoc?: string;
  isRequired?: boolean;
  errorHandling?: string;
  // 流程控制配置
  approvalRole?: string;
  conditionBranch?: {
    yesPath?: string;
    noPath?: string;
  };
}

// 节点库项目
export interface NodeLibraryItem {
  id: string;
  type: NodeType;
  label: string;
  category?: CheckCategory;
  interactionType?: InteractionType;
  color: string;
  icon: string;
  description: string;
}

// 流程配置
export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  createdAt: string;
  updatedAt: string;
}

// 边数据
export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

// 节点库分组
export const CHECK_CATEGORY_NODES: NodeLibraryItem[] = [
  {
    id: 'basic-compliance',
    type: 'check-category',
    label: '基础合规性校验',
    category: 'basic-compliance',
    color: '#3b82f6',
    icon: 'Shield',
    description: '检查基本合规性要求',
  },
  {
    id: 'file-content',
    type: 'check-category',
    label: '文件内容校验',
    category: 'file-content',
    color: '#10b981',
    icon: 'FileText',
    description: '校验文件内容完整性',
  },
  {
    id: 'file-reference',
    type: 'check-category',
    label: '文件参照性',
    category: 'file-reference',
    color: '#f59e0b',
    icon: 'Link',
    description: '检查文件引用关系',
  },
  {
    id: 'keyword-check',
    type: 'check-category',
    label: '关键字校验',
    category: 'keyword-check',
    color: '#ef4444',
    icon: 'Search',
    description: '关键字匹配检查',
  },
  {
    id: 'change-record',
    type: 'check-category',
    label: '变更记录审查',
    category: 'change-record',
    color: '#8b5cf6',
    icon: 'History',
    description: '审查变更历史记录',
  },
  {
    id: 'signature-check',
    type: 'check-category',
    label: '签字情况',
    category: 'signature-check',
    color: '#ec4899',
    icon: 'PenTool',
    description: '检查签字审批情况',
  },
];

export const INTERACTION_TYPE_NODES: NodeLibraryItem[] = [
  {
    id: 'file-parse',
    type: 'interaction',
    label: '文件解析',
    interactionType: 'file-parse',
    color: '#06b6d4',
    icon: 'FileSearch',
    description: '解析上传的文件',
  },
  {
    id: 'qa-interaction',
    type: 'interaction',
    label: '问答交互',
    interactionType: 'qa-interaction',
    color: '#14b8a6',
    icon: 'MessageCircle',
    description: '通过问答方式交互',
  },
  {
    id: 'option-select',
    type: 'interaction',
    label: '选项选择',
    interactionType: 'option-select',
    color: '#f97316',
    icon: 'CheckSquare',
    description: '单选或多选交互',
  },
  {
    id: 'sub-process',
    type: 'interaction',
    label: '子流程',
    interactionType: 'sub-process',
    color: '#a855f7',
    icon: 'GitBranch',
    description: '嵌套子流程',
  },
  {
    id: 'script-check',
    type: 'interaction',
    label: '脚本检查',
    interactionType: 'script-check',
    color: '#6366f1',
    icon: 'Code',
    description: '执行脚本检查',
  },
];

export const WORKFLOW_STAGES: { id: WorkflowStage; label: string; color: string }[] = [
  { id: 'preparation', label: '准备阶段', color: '#e2e8f0' },
  { id: 'initial-review', label: '初审阶段', color: '#fef3c7' },
  { id: 'detailed-review', label: '详审阶段', color: '#dbeafe' },
  { id: 'approval', label: '审批阶段', color: '#d1fae5' },
  { id: 'completion', label: '完成阶段', color: '#fce7f3' },
];
