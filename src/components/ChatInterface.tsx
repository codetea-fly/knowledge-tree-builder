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
  chatId: string;
  knowledgeTree: object; // 知识树配置将作为上下文传递
  conversationHistory: Message[];
}

// fastgpt 流式接口
async function* streamChatResponse(params: ChatRequestParams): AsyncGenerator<string> {
  const response = await fetch('/api/v2/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer fastgpt-griiY9jCGi1QO45y6zX8N0VKibNxFKU9I3AU3t2Fdgb9bbKFeaqqJi872t',
    },
    body: JSON.stringify({
      appId:'69267aea013a61eaaa033518',
      chatId: params.chatId,
      stream: true,
      detail: false,
      messages: [
        {
          role: 'user',
          content: params.message,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Readable stream is not available on response');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line === 'data: [DONE]') continue;

      // fastgpt SSE 风格：以 data: 开头，内容可能是 JSON 或纯文本
      const payload = line.startsWith('data:') ? line.slice(5).trim() : line;
      if (!payload) continue;

      try {
        const parsed = JSON.parse(payload);
        const choice = parsed?.choices?.[0];
        const textChunk =
          choice?.delta?.content ??
          choice?.message?.content ??
          parsed?.content ??
          parsed?.text;

        if (typeof textChunk === 'string' && textChunk.length > 0) {
          yield textChunk;
          continue;
        }

        // 如果解析后不是可直接输出的字符串，回退到原始 payload
        if (typeof parsed === 'string') {
          yield parsed;
        }
      } catch {
        // 非 JSON 文本直接输出
        yield payload;
      }
    }
  }

  // 处理残余缓冲
  if (buffer.trim()) {
    yield buffer.trim();
  }
}
// ============================================

export const ChatInterface: React.FC = () => {
  const { tree } = useTree();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatId, setChatId] = useState<string>(() => {
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const CHAT_STORAGE_KEY = 'knowledge-tree-builder:chat-messages';

  const handleClearHistory = () => {
    setMessages([]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(`chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  };

  // 初始化加载本地历史消息
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        // 简单校验结构
        if (Array.isArray(parsed)) {
          setMessages(
            parsed.map((m) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }))
          );
        }
      }
    } catch (e) {
      console.error('Failed to load chat history from localStorage', e);
    }
  }, []);

  // 消息变化时自动保存到本地
  useEffect(() => {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } else {
        localStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify(
            messages.map((m) => ({
              ...m,
              // 确保可序列化
              timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
            }))
          )
        );
      }
    } catch (e) {
      console.error('Failed to save chat history to localStorage', e);
    }
  }, [messages]);

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
        chatId,
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TreeDeciduous className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">当前知识树配置</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={messages.length === 0 || isStreaming}
            >
              清空对话
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              disabled={isStreaming}
            >
              新对话
            </Button>
          </div>
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
