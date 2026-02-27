import React, { useState, useCallback } from 'react';
import { WorkflowStep, QAQuestionItem } from '@/types/workflow';
import { QARoundRecord } from '@/types/stepApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Sparkles, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QAInteractionUIProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

interface QAConversationEntry {
  role: 'question' | 'answer' | 'followUp';
  content: string;
  questionId?: string;
  validation?: { isValid: boolean; feedback?: string };
}

export const QAInteractionUI: React.FC<QAInteractionUIProps> = ({ step, onSubmit, onUseMock }) => {
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState<QAConversationEntry[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [qaHistory, setQaHistory] = useState<QARoundRecord[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const config = step.checkConfig;
  const qaQuestions = config?.qaQuestions || [];
  const useMultiRound = qaQuestions.length > 0;
  const useAiValidation = config?.useAiValidation;

  // 单题兼容模式
  const singleQuestion = config?.question || '请回答以下问题';

  // 获取当前问题
  const getCurrentQuestion = useCallback((): { id: string; question: string; item?: QAQuestionItem } => {
    if (!useMultiRound) {
      return { id: 'single', question: singleQuestion };
    }
    if (currentQuestionIndex < qaQuestions.length) {
      const q = qaQuestions[currentQuestionIndex];
      return { id: q.id, question: q.question, item: q };
    }
    return { id: 'done', question: '' };
  }, [useMultiRound, singleQuestion, currentQuestionIndex, qaQuestions]);

  const currentQ = getCurrentQuestion();

  // 初始化第一个问题到对话中
  React.useEffect(() => {
    if (conversation.length === 0 && currentQ.question) {
      setConversation([{ role: 'question', content: currentQ.question, questionId: currentQ.id }]);
    }
  }, []);

  const handleSubmit = () => {
    if (!answer.trim()) return;

    const trimmedAnswer = answer.trim();

    if (!useMultiRound) {
      // 单题模式：直接提交
      onSubmit({
        answer: trimmedAnswer,
        submittedAt: new Date().toISOString(),
      });
      return;
    }

    // 多轮模式
    const newRecord: QARoundRecord = {
      questionId: currentQ.id,
      question: currentQ.question,
      answer: trimmedAnswer,
      isFollowUp: followUpCount > 0,
    };

    const updatedHistory = [...qaHistory, newRecord];
    setQaHistory(updatedHistory);

    // 更新对话
    const updatedConversation: QAConversationEntry[] = [
      ...conversation,
      { role: 'answer', content: trimmedAnswer, questionId: currentQ.id },
    ];

    const currentItem = currentQ.item;
    const maxFollowUp = currentItem?.maxFollowUpRounds || 3;

    // 检查是否需要追问
    if (currentItem?.enableFollowUp && followUpCount < maxFollowUp) {
      // 提交并请求AI追问
      setConversation(updatedConversation);
      setAnswer('');
      
      onSubmit({
        type: 'qa_round',
        currentQuestionId: currentQ.id,
        answer: trimmedAnswer,
        qaHistory: updatedHistory,
        requestFollowUp: true,
        followUpPrompt: currentItem.followUpPrompt,
        aiValidationPrompt: config?.aiValidationPrompt,
        useAiValidation,
        allQuestions: qaQuestions,
        currentQuestionIndex,
        followUpCount: followUpCount + 1,
      });
      return;
    }

    // 不需要追问，进入下一题
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < qaQuestions.length) {
      const nextQ = qaQuestions[nextIndex];
      updatedConversation.push({ role: 'question', content: nextQ.question, questionId: nextQ.id });
      setConversation(updatedConversation);
      setCurrentQuestionIndex(nextIndex);
      setFollowUpCount(0);
      setAnswer('');
    } else {
      // 所有问题已完成
      setConversation(updatedConversation);
      setIsCompleted(true);
      
      onSubmit({
        type: 'qa_complete',
        qaHistory: updatedHistory,
        useAiValidation,
        aiValidationPrompt: config?.aiValidationPrompt,
        allQuestions: qaQuestions,
      });
    }
  };

  // 处理AI追问返回后继续对话（由executor通过回调触发）
  const handleFollowUpContinue = useCallback((followUpQuestion: string) => {
    setConversation(prev => [
      ...prev,
      { role: 'followUp', content: followUpQuestion, questionId: currentQ.id },
    ]);
    setFollowUpCount(prev => prev + 1);
  }, [currentQ.id]);

  const progressText = useMultiRound
    ? `问题 ${Math.min(currentQuestionIndex + 1, qaQuestions.length)} / ${qaQuestions.length}`
    : '';

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
          <div className="flex items-center gap-2">
            {useMultiRound && (
              <Badge variant="outline" className="text-xs">
                {progressText}
              </Badge>
            )}
            {useAiValidation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI验证
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 对话历史 */}
        {conversation.length > 0 && (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-3">
              {conversation.map((entry, idx) => (
                <div key={idx} className={`flex ${entry.role === 'answer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    entry.role === 'answer'
                      ? 'bg-primary text-primary-foreground'
                      : entry.role === 'followUp'
                        ? 'bg-accent text-accent-foreground border border-border'
                        : 'bg-muted text-foreground'
                  }`}>
                    {entry.role === 'followUp' && (
                      <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                        <Sparkles className="h-3 w-3" />
                        AI追问
                      </div>
                    )}
                    {entry.role === 'question' && idx > 0 && (
                      <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                        <ChevronRight className="h-3 w-3" />
                        下一题
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                    {entry.validation && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        entry.validation.isValid ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {entry.validation.isValid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {entry.validation.feedback}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* 当前问题（非多轮时直接显示） */}
        {!useMultiRound && (
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium text-foreground">问题</Label>
            <p className="mt-1 text-foreground">{singleQuestion}</p>
          </div>
        )}

        {/* 答案输入 */}
        {!isCompleted && (
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
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {!isCompleted ? (
            <>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!answer.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {useMultiRound ? '提交回答' : '提交回答'}
              </Button>
              <Button variant="outline" onClick={onUseMock}>
                使用Mock数据
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              所有问题已回答完毕，正在验证...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
