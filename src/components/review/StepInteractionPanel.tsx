import React from 'react';
import { WorkflowStep, StepType } from '@/types/workflow';
import { FileParseUI } from './step-ui/FileParseUI';
import { QAInteractionUI } from './step-ui/QAInteractionUI';
import { SingleSelectUI } from './step-ui/SingleSelectUI';
import { MultiSelectUI } from './step-ui/MultiSelectUI';
import { ScriptCheckUI } from './step-ui/ScriptCheckUI';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface StepInteractionPanelProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

// 步骤类型到UI组件的映射
const stepUIComponents: Partial<Record<StepType, React.ComponentType<{
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}>>> = {
  file_parse: FileParseUI,
  qa_interaction: QAInteractionUI,
  single_select: SingleSelectUI,
  multi_select: MultiSelectUI,
  script_check: ScriptCheckUI,
};

// 需要交互的步骤类型
const interactiveStepTypes: StepType[] = [
  'file_parse',
  'qa_interaction',
  'single_select',
  'multi_select',
  'script_check',
];

export const isInteractiveStep = (stepType: StepType): boolean => {
  return interactiveStepTypes.includes(stepType);
};

export const StepInteractionPanel: React.FC<StepInteractionPanelProps> = ({
  step,
  onSubmit,
  onUseMock,
}) => {
  const UIComponent = stepUIComponents[step.stepType];

  if (!UIComponent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">未知步骤类型</p>
              <p className="text-sm">步骤类型 "{step.stepType}" 暂不支持交互</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <UIComponent step={step} onSubmit={onSubmit} onUseMock={onUseMock} />;
};

export default StepInteractionPanel;
