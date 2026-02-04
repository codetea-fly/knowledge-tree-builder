import React, { useState } from 'react';
import { WorkflowStep } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SingleSelectUIProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

export const SingleSelectUI: React.FC<SingleSelectUIProps> = ({ step, onSubmit, onUseMock }) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const config = step.checkConfig;
  const options = config?.options || [];
  const question = config?.question || '请选择一个选项';

  const handleSubmit = () => {
    if (!selectedValue) return;
    
    const selectedOption = options.find(opt => opt.value === selectedValue);
    
    // TODO: 这里预留真实提交逻辑
    // 实际实现时，应该：
    // 1. 验证选择是否符合要求
    // 2. 返回选择结果
    
    onSubmit({
      selectedValue,
      selectedLabel: selectedOption?.label,
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{step.name}</CardTitle>
        <CardDescription>
          {step.description || question}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 选项列表 */}
        <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
          <div className="space-y-2">
            {options.map((option) => (
              <Label
                key={option.value}
                htmlFor={`${step.id}-${option.value}`}
                className={cn(
                  'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                  selectedValue === option.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${step.id}-${option.value}`}
                  className="sr-only"
                />
                {selectedValue === option.value ? (
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </Label>
            ))}
          </div>
        </RadioGroup>

        {options.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无可选项目</p>
            <p className="text-sm">请在步骤配置中添加选项</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedValue}
          >
            确认选择
          </Button>
          <Button variant="outline" onClick={onUseMock}>
            使用Mock数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
