import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useAIDiaryChat';
import { Loader2 } from 'lucide-react';

interface FreeChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export default function FreeChatMessages({ messages, isLoading }: FreeChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div ref={scrollRef} className="space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">Начните диалог с AI-помощником</p>
            <p className="text-sm mt-2">
              Поделитесь своими мыслями, чувствами или просто поговорите о том, что вас волнует
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI думает...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
