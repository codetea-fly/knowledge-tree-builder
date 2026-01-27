export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignee_type: 'role' | 'user' | 'department';
  assignee_value: string;
  timeout_hours: number;
  required: boolean;
  conditions: StepCondition[];
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface ReviewWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  steps: WorkflowStep[];
}

export const defaultWorkflow: ReviewWorkflow = {
  id: 'default',
  name: '默认审核流程',
  description: '标准审核流程配置',
  enabled: true,
  steps: [
    {
      id: 'step-1',
      name: '初审',
      description: '由部门负责人进行初步审核',
      assignee_type: 'role',
      assignee_value: '部门主管',
      timeout_hours: 24,
      required: true,
      conditions: [],
    },
    {
      id: 'step-2',
      name: '复审',
      description: '由质量管理部门进行复核',
      assignee_type: 'department',
      assignee_value: '质量管理部',
      timeout_hours: 48,
      required: true,
      conditions: [],
    },
  ],
};
