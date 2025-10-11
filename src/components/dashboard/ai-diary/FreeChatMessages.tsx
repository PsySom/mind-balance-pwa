import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useAIDiaryChat';
import { Loader2 } from 'lucide-react';

interface FreeChatMessagesProps {
  messages: ChatMessageType[];
  isTyping: boolean;
}

export default function FreeChatMessages({ messages, isTyping }: FreeChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div ref={scrollRef} className="space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI печатает...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
