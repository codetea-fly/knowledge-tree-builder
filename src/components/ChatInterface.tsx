import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, Message } from '@/components/ChatMessage';
import { useTree } from '@/context/TreeContext';
import { Send, Loader2, TreeDeciduous, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// 预留的后端AI接口调用位置
// ============================================
interface ChatRequestParams {
  message: string;
  knowledgeTree: object; // 知识树配置将作为上下文传递
  conversationHistory: Message[];
}

// 模拟流式响应的函数 - 替换为实际的后端API调用
async function* streamChatResponse(params: ChatRequestParams): AsyncGenerator<string> {
  // TODO: 替换为实际的后端API调用
  // 示例: 
  // const response = await fetch('/api/chat', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(params),
  // });
  // const reader = response.body?.getReader();
  // ...处理流式响应

  // 模拟流式响应
  const mockResponse = `我已收到你的消息："${params.message}"

基于你配置的知识树，我可以看到：
- 文件：${(params.knowledgeTree as any).file || '未配置'}
- 过程域数量：${(params.knowledgeTree as any).process_domains?.length || 0} 个

这是一个模拟的流式响应。请在 ChatInterface.tsx 中的 streamChatResponse 函数里接入实际的后端AI接口。`;

  const words = mockResponse.split('');
  for (const word of words) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    yield word;
  }
}
// ============================================

export const ChatInterface: React.FC = () => {
  const { tree } = useTree();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // 创建AI消息占位
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      // 调用流式响应
      const stream = streamChatResponse({
        message: userMessage.content,
        knowledgeTree: tree,
        conversationHistory: messages,
      });

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: '抱歉，发生了错误。请稍后重试。' }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasTreeConfig = tree.file || tree.process_domains.length > 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 知识树配置状态提示 */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">当前知识树配置</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {hasTreeConfig ? (
            <>
              文件: {tree.file || '未命名'} | 过程域: {tree.process_domains.length} 个
            </>
          ) : (
            <span className="flex items-center gap-1 text-amber-600">
              <Info className="h-3 w-3" />
              请先在「树配置」中配置知识树
            </span>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TreeDeciduous className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              知识库 AI 助手
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              基于你配置的知识树进行对话。AI 将根据知识树的结构和内容为你提供帮助。
            </p>
            {!hasTreeConfig && (
              <div className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600">
                  提示：请先切换到「树配置」完成知识树配置
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 输入区域 */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            className="min-h-[60px] max-h-[200px] resize-none bg-background"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="self-end h-10 px-4"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
