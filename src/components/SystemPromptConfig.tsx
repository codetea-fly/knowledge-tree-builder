import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bot, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PROMPT = `你是一个知识库AI助手。请基于用户配置的知识树结构，帮助用户理解和使用知识库中的内容。

你的职责：
1. 理解用户提供的知识树结构
2. 根据知识树中的过程域和关联域回答问题
3. 提供准确、有帮助的信息`;

export interface SystemPromptData {
  name: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
}

interface SystemPromptConfigProps {
  value: SystemPromptData;
  onChange: (data: SystemPromptData) => void;
}

export const SystemPromptConfig: React.FC<SystemPromptConfigProps> = ({
  value,
  onChange,
}) => {
  const handleSave = () => {
    toast.success('系统提示词配置已保存');
  };

  const handleReset = () => {
    onChange({
      ...value,
      prompt: DEFAULT_PROMPT,
    });
    toast.info('已重置为默认提示词');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">系统提示词配置</span>
        </div>
        <p className="text-xs text-muted-foreground">
          配置AI对话的系统提示词和参数
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 配置名称 */}
        <div className="space-y-2">
          <Label htmlFor="prompt-name">配置名称</Label>
          <Input
            id="prompt-name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="如：知识库助手"
            className="bg-background"
          />
        </div>

        {/* 系统提示词 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="system-prompt">系统提示词</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              重置默认
            </Button>
          </div>
          <Textarea
            id="system-prompt"
            value={value.prompt}
            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
            placeholder="输入系统提示词..."
            className="min-h-[200px] bg-background font-mono text-sm"
          />
        </div>

        {/* 参数配置 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={value.temperature}
              onChange={(e) =>
                onChange({ ...value, temperature: parseFloat(e.target.value) || 0 })
              }
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">控制输出的随机性 (0-2)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-tokens">最大Token数</Label>
            <Input
              id="max-tokens"
              type="number"
              step="100"
              min="100"
              max="8000"
              value={value.maxTokens}
              onChange={(e) =>
                onChange({ ...value, maxTokens: parseInt(e.target.value) || 1000 })
              }
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">单次响应最大长度</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          保存配置
        </Button>
      </div>
    </div>
  );
};

export const defaultSystemPromptData: SystemPromptData = {
  name: '默认配置',
  prompt: DEFAULT_PROMPT,
  temperature: 0.7,
  maxTokens: 2000,
};
