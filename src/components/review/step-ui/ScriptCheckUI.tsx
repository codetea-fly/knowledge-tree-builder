import React, { useState } from 'react';
import { WorkflowStep } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ScriptCheckUIProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export const ScriptCheckUI: React.FC<ScriptCheckUIProps> = ({ step, onSubmit, onUseMock }) => {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const config = step.checkConfig;
  const scriptContent = config?.scriptContent || '// 无脚本内容';
  const scriptLanguage = config?.scriptLanguage || 'javascript';

  const handleExecute = async () => {
    setStatus('running');
    setLogs(['开始执行脚本...']);
    
    // 模拟脚本执行过程
    await new Promise(resolve => setTimeout(resolve, 500));
    setLogs(prev => [...prev, `语言: ${scriptLanguage}`]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setLogs(prev => [...prev, '正在解析脚本...']);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLogs(prev => [...prev, '执行中...']);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟成功/失败
    const success = Math.random() > 0.3;
    
    if (success) {
      setLogs(prev => [...prev, '✓ 脚本执行成功', '所有检查项通过']);
      setStatus('success');
    } else {
      setLogs(prev => [...prev, '✗ 脚本执行失败', '检查项未通过: 存在不符合项']);
      setStatus('error');
    }
    
    // TODO: 这里预留真实脚本执行逻辑
    // 实际实现时，应该：
    // 1. 将脚本发送到后端执行
    // 2. 流式接收执行日志
    // 3. 返回执行结果
    
    onSubmit({
      success,
      logs,
      executedAt: new Date().toISOString(),
    });
  };

  const getLanguageBadge = () => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-100 text-yellow-800',
      python: 'bg-blue-100 text-blue-800',
      sql: 'bg-green-100 text-green-800',
    };
    return colors[scriptLanguage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="h-4 w-4" />
              {step.name}
            </CardTitle>
            <CardDescription>
              {step.description || '执行自动化检查脚本'}
            </CardDescription>
          </div>
          <Badge className={getLanguageBadge()}>
            {scriptLanguage.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 脚本预览 */}
        <div className="relative">
          <ScrollArea className="h-32 w-full rounded-md border bg-muted/50">
            <pre className="p-4 text-xs font-mono text-foreground">
              {scriptContent}
            </pre>
          </ScrollArea>
        </div>

        {/* 执行日志 */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">执行日志</span>
              {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
            </div>
            <ScrollArea className="h-24 w-full rounded-md border bg-black/90">
              <div className="p-3 font-mono text-xs space-y-1">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      log.startsWith('✓') && 'text-green-400',
                      log.startsWith('✗') && 'text-red-400',
                      !log.startsWith('✓') && !log.startsWith('✗') && 'text-gray-300'
                    )}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleExecute}
            disabled={status === 'running'}
          >
            {status === 'running' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                执行中...
              </>
            ) : status === 'success' || status === 'error' ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                重新执行
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                执行脚本
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onUseMock}>
            使用Mock数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
