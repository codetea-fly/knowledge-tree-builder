import React, { useState } from 'react';
import { WorkflowStep } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MultiSelectUIProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

export const MultiSelectUI: React.FC<MultiSelectUIProps> = ({ step, onSubmit, onUseMock }) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const config = step.checkConfig;
  const options = config?.options || [];
  const question = config?.question || '请选择一个或多个选项';
  const minSelect = config?.minSelect || 0;
  const maxSelect = config?.maxSelect || options.length;

  const toggleOption = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      }
      if (prev.length >= maxSelect) {
        return prev;
      }
      return [...prev, value];
    });
  };

  const handleSubmit = () => {
    if (selectedValues.length < minSelect) return;
    
    const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));
    
    // TODO: 这里预留真实提交逻辑
    // 实际实现时，应该：
    // 1. 验证选择数量是否符合要求
    // 2. 返回选择结果
    
    onSubmit({
      selectedValues,
      selectedLabels: selectedOptions.map(opt => opt.label),
      submittedAt: new Date().toISOString(),
    });
  };

  const isValid = selectedValues.length >= minSelect && selectedValues.length <= maxSelect;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{step.name}</CardTitle>
            <CardDescription>
              {step.description || question}
            </CardDescription>
          </div>
          <Badge variant="outline">
            已选 {selectedValues.length}/{maxSelect}
          </Badge>
        </div>
        {(minSelect > 0 || maxSelect < options.length) && (
          <p className="text-xs text-muted-foreground mt-1">
            {minSelect > 0 && `至少选择 ${minSelect} 项`}
            {minSelect > 0 && maxSelect < options.length && '，'}
            {maxSelect < options.length && `最多选择 ${maxSelect} 项`}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 选项列表 */}
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const isDisabled = !isSelected && selectedValues.length >= maxSelect;
            
            return (
              <Label
                key={option.value}
                htmlFor={`${step.id}-${option.value}`}
                className={cn(
                  'flex items-center gap-3 p-4 border rounded-lg transition-all',
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <Checkbox
                  id={`${step.id}-${option.value}`}
                  checked={isSelected}
                  onCheckedChange={() => !isDisabled && toggleOption(option.value)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
            );
          })}
        </div>

        {options.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无可选项目</p>
            <p className="text-sm">请在步骤配置中添加选项</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            确认选择 ({selectedValues.length})
          </Button>
          <Button variant="outline" onClick={onUseMock}>
            使用Mock数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
