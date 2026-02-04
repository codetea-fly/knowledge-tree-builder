import React, { useState } from 'react';
import { WorkflowStep } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QAInteractionUIProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

export const QAInteractionUI: React.FC<QAInteractionUIProps> = ({ step, onSubmit, onUseMock }) => {
  const [answer, setAnswer] = useState('');

  const config = step.checkConfig;
  const question = config?.question || '请回答以下问题';
  const useAiValidation = config?.useAiValidation;

  const handleSubmit = () => {
    if (!answer.trim()) return;
    
    // TODO: 这里预留真实提交逻辑
    // 实际实现时，应该：
    // 1. 验证答案格式
    // 2. 如果启用AI验证，调用AI接口
    // 3. 返回验证结果
    
    onSubmit({
      answer: answer.trim(),
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {step.name}
            </CardTitle>
            <CardDescription>
              {step.description || '请根据问题提供您的回答'}
            </CardDescription>
          </div>
          {useAiValidation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI验证
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 问题展示 */}
        <div className="p-4 bg-muted rounded-lg">
          <Label className="text-sm font-medium text-foreground">问题</Label>
          <p className="mt-1 text-foreground">{question}</p>
        </div>

        {/* 答案输入 */}
        <div className="space-y-2">
          <Label htmlFor={`answer-${step.id}`}>您的回答</Label>
          <Textarea
            id={`answer-${step.id}`}
            placeholder="请在此输入您的回答..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="resize-none"
          />
          {config?.expectedAnswer && (
            <p className="text-xs text-muted-foreground">
              提示: 请根据要求详细作答
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            提交回答
          </Button>
          <Button variant="outline" onClick={onUseMock}>
            使用Mock数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
