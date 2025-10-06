import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Send, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmotionCard from './EmotionCard';
import InsightsCard from './InsightsCard';
import { config } from '@/lib/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotions?: {
    primary: string;
    intensity: string;
    triggers: string[];
  };
  analysis?: {
    cognitive_distortions: string[];
    themes: string[];
    mood_score: number;
  };
}

interface DiaryResponse {
  ai_response: string;
  emotions?: any;
  analysis?: any;
}

export default function AIDiaryChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Загрузка истории переписки из localStorage при монтировании
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai-diary-messages');
    const savedSessionId = localStorage.getItem('ai-diary-session-id');
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Восстановить объекты Date
        const messagesWithDates = parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  // Сохранение истории переписки в localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-diary-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Сохранение session_id в localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('ai-diary-session-id', sessionId);
    }
  }, [sessionId]);

  // Автофокус на поле ввода при монтировании
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Сохранение draft в localStorage
  useEffect(() => {
    const draft = localStorage.getItem('ai-diary-draft');
    if (draft) {
      setInput(draft);
    }
  }, []);

  useEffect(() => {
    if (input) {
      localStorage.setItem('ai-diary-draft', input);
    } else {
      localStorage.removeItem('ai-diary-draft');
    }
  }, [input]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserJwt(session.access_token);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !userJwt || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const webhookUrl = config.webhooks.diary;
      const requestBody = {
        userJwt,
        user_id: userId,
        message: messageText,
        locale: 'ru',
        session_id: sessionId || `session_${Date.now()}`,
      };

      console.log('Diary Webhook URL:', webhookUrl);
      console.log('Request body:', requestBody);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error:', response.status, errorText);
        throw new Error(`Ошибка при получении ответа: ${response.status}`);
      }

      const response_data = await response.json();
      
      if (!response_data.success) {
        throw new Error('Webhook вернул ошибку');
      }

      const data = response_data.data || response_data;

      // Обновить session_id для следующих сообщений
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.ai_response || 'Ответ не получен',
        timestamp: new Date(),
        emotions: data.emotions,
        analysis: data.analysis,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Вернуть поле ввода с исходным текстом
      setInput(messageText);
      
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось получить ответ от AI. Попробуйте еще раз.',
        variant: 'destructive',
      });
      console.error('Error:', error);
      
      // Удалить сообщение пользователя из чата, так как оно не было обработано
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] bg-card rounded-2xl shadow-lg animate-fade-in" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p>Начните общение с AI помощником</p>
              <p className="text-sm mt-2">Расскажите о своих мыслях и переживаниях</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[85%] md:max-w-[80%] space-y-2 ${message.role === 'user' ? '' : 'w-full'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.role === 'assistant' && (message.emotions || message.analysis) && (
                  <Collapsible className="w-full">
                    <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronDown className="w-4 h-4" />
                      <span>Показать анализ</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {message.emotions && (
                        <EmotionCard
                          primary={message.emotions.primary}
                          intensity={message.emotions.intensity}
                          triggers={message.emotions.triggers}
                        />
                      )}
                      {message.analysis && (
                        <InsightsCard
                          cognitive_distortions={message.analysis.cognitive_distortions}
                          themes={message.analysis.themes}
                          mood_score={message.analysis.mood_score}
                        />
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">AI печатает...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Напишите сообщение... (Enter или Ctrl+Enter для отправки)"
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
