import React from 'react';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('max-w-[70%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="font-medium text-sm text-foreground">
            {isUser ? '你' : 'AI 助手'}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        {/* 思考过程 */}
        {!isUser && message.thinking && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1">
              <span className="group-open:rotate-90 transition-transform">▶</span>
              思考过程
            </summary>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 mb-2 border border-border/50">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.thinking}</ReactMarkdown>
            </div>
          </details>
        )}
        <div
          className={cn(
            'text-sm leading-relaxed rounded-lg p-3',
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none 
              prose-p:my-2 prose-p:leading-relaxed
              prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
              prose-headings:my-3 prose-headings:font-semibold
              prose-pre:my-3 prose-pre:bg-background/80 prose-pre:border prose-pre:border-border prose-pre:rounded-lg
              prose-code:bg-background/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
              prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden prose-table:my-3
              prose-thead:bg-muted/70
              prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
              prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
              prose-tr:even:bg-muted/30
              prose-img:rounded-lg prose-img:max-w-full prose-img:my-3 prose-img:shadow-md
              prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
              prose-hr:border-border prose-hr:my-4
              prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
