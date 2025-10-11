import { ChatMessage as ChatMessageType } from '@/hooks/useAIDiaryChat';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  
  // Системные сообщения (приветствия) показываем по центру
  if (isSystem) {
    return (
      <div className="flex justify-center animate-fade-in">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-[80%] text-center">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex gap-3 items-start animate-fade-in",
      isUser && "flex-row-reverse"
    )}>
      {/* Аватар */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      {/* Содержимое */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg p-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <p className="text-sm whitespace-pre-wrap">
            {message.content}
            {message.isTyping && (
              <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
            )}
          </p>
          
          {/* Эмоции (только для AI сообщений) */}
          {!isUser && message.emotions && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Эмоция: <span className="font-medium">{message.emotions.primary}</span>
                {' '}({message.emotions.intensity})
              </p>
            </div>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}

