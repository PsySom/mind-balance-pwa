import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface FreeChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function FreeChatInput({ onSend, isLoading }: FreeChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSend = () => {
    if (!inputMessage.trim() || isLoading) return;
    
    onSend(inputMessage);
    setInputMessage('');
    
    // Возвращаем фокус на input
    setTimeout(() => textareaRef.current?.focus(), 100);
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение... (Enter для отправки, Shift+Enter для новой строки)"
          className="min-h-[60px] max-h-[200px]"
          disabled={isLoading}
        />
        
        <Button 
          onClick={handleSend}
          disabled={!inputMessage.trim() || isLoading}
          size="icon"
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {inputMessage.length}/2000 символов
      </p>
    </div>
  );
}
