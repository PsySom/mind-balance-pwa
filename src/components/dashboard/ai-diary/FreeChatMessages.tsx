import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import QuickSuggestions from './QuickSuggestions';
import { ChatMessage as ChatMessageType } from '@/hooks/useAIDiaryChat';
import { Loader2 } from 'lucide-react';

interface FreeChatMessagesProps {
  messages: ChatMessageType[];
  isTyping: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export default function FreeChatMessages({ 
  messages, 
  isTyping, 
  onSuggestionClick 
}: FreeChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={message.id}>
          <ChatMessage message={message} />
          
          {/* Показываем suggestions под последним сообщением (AI или system) */}
          {(message.type === 'ai' || message.type === 'system') && 
           message.suggestions && 
           message.suggestions.length > 0 &&
           index === messages.length - 1 &&
           !isTyping && (
            <QuickSuggestions 
              suggestions={message.suggestions}
              onClick={onSuggestionClick}
            />
          )}
        </div>
      ))}
      
      {/* Индикатор "AI печатает..." */}
      {isTyping && (
        <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">AI печатает...</span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
