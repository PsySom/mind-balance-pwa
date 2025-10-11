import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { aiDiaryService } from '@/services/ai-diary.service';
import { aiDiarySessionsService } from '@/services/ai-diary-sessions.service';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  suggestions?: string[];
  emotions?: any;
  analysis?: any;
  timestamp: string;
  isTyping?: boolean;
}

export function useAIDiaryChat() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const realtimeChannelRef = useRef<any>(null);
  
  // Инициализация - загрузка существующей сессии или показ приветствия
  useEffect(() => {
    if (!user) return;
    
    const initSession = async () => {
      const currentSession = await aiDiarySessionsService.getCurrentSession(user.id);
      
      if (currentSession) {
        // Загружаем историю существующей сессии
        setSessionId(currentSession.session_id);
        const history = await aiDiarySessionsService.getSessionMessages(currentSession.session_id);
        
        const chatMessages: ChatMessage[] = history.map(msg => ({
          id: msg.id,
          type: msg.message_type as 'user' | 'ai',
          content: msg.message_type === 'user' ? msg.message! : msg.ai_response!,
          suggestions: msg.suggestions,
          emotions: msg.emotions,
          analysis: msg.analysis,
          timestamp: msg.created_at
        }));
        
        setMessages(chatMessages);
        
        // Подписываемся на Realtime обновления
        subscribeToSession(currentSession.session_id);
      } else {
        // Новый пользователь - показываем приветствие
        setMessages([{
          id: 'welcome',
          type: 'system',
          content: 'Привет! Я ваш AI-помощник для психологического благополучия. Расскажите, как ваше настроение сегодня?',
          suggestions: [
            'Расскажу о своем дне',
            'Хочу поговорить о стрессе',
            'Как дела?',
            'Чувствую тревогу'
          ],
          timestamp: new Date().toISOString()
        }]);
      }
    };
    
    initSession();
    
    // Cleanup при размонтировании
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, [user]);
  
  // Подписка на Realtime
  const subscribeToSession = (sessId: string) => {
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }
    
    realtimeChannelRef.current = aiDiarySessionsService.subscribeToSession(
      sessId,
      handleNewAIMessage
    );
  };
  
  // Обработчик нового AI сообщения через Realtime
  const handleNewAIMessage = useCallback((aiMessageData: any) => {
    setIsTyping(false);
    
    const aiMessage: ChatMessage = {
      id: aiMessageData.id,
      type: 'ai',
      content: '',
      suggestions: aiMessageData.suggestions || [],
      emotions: aiMessageData.emotions,
      analysis: aiMessageData.analysis,
      timestamp: aiMessageData.created_at,
      isTyping: true
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Эффект печати
    typeMessage(aiMessage.id, aiMessageData.ai_response);
  }, []);
  
  // Эффект печати для AI ответов
  const typeMessage = (messageId: string, fullText: string) => {
    if (fullText.length <= 50) {
      // Короткие сообщения показываем сразу с небольшой задержкой
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: fullText, isTyping: false }
            : msg
        ));
      }, 500);
    } else {
      // Длинные сообщения печатаем посимвольно
      let currentIndex = 0;
      const typingSpeed = 30; // 30ms между символами
      
      const typeNextChar = () => {
        if (currentIndex <= fullText.length) {
          const currentText = fullText.substring(0, currentIndex);
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: currentText, isTyping: currentIndex < fullText.length }
              : msg
          ));
          currentIndex++;
          setTimeout(typeNextChar, typingSpeed);
        }
      };
      
      typeNextChar();
    }
  };
  
  // Отправка сообщения
  const sendMessage = async (messageText: string) => {
    if (!user || !session || !messageText.trim()) return;
    
    setIsLoading(true);
    
    // Добавляем сообщение пользователя в UI сразу
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Отправляем на backend
      const response = await aiDiaryService.sendMessage(
        session.access_token,
        user.id,
        messageText,
        sessionId,
        'ru'
      );
      
      if (response.success) {
        // Сохраняем или обновляем session_id
        const newSessionId = response.data.session_id;
        if (!sessionId) {
          setSessionId(newSessionId);
          aiDiaryService.setCurrentSessionId(newSessionId);
          subscribeToSession(newSessionId);
        }
        
        // Показываем индикатор "AI печатает..."
        setIsTyping(true);
        
        // Ответ придет через Realtime в handleNewAIMessage
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение. Попробуйте еще раз.',
        variant: 'destructive'
      });
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Начать новую сессию
  const startNewSession = async () => {
    if (!user) return;
    
    // Отписываемся от текущей Realtime подписки
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }
    
    // Создаем новую сессию
    const newSession = await aiDiarySessionsService.createSession(user.id);
    setSessionId(newSession.session_id);
    
    // Очищаем сообщения и показываем приветствие
    setMessages([{
      id: 'welcome_new',
      type: 'system',
      content: 'Начинаем новую беседу. О чем хотели бы поговорить?',
      suggestions: [
        'Расскажу о своих мыслях',
        'Хочу поделиться переживаниями',
        'Нужна поддержка',
        'Обсудим планы'
      ],
      timestamp: new Date().toISOString()
    }]);
    
    toast({
      title: 'Новая сессия',
      description: 'Создана новая сессия для диалога',
    });
  };
  
  // Завершить сессию
  const endSession = async () => {
    if (!sessionId) return;
    
    await aiDiarySessionsService.endSession(sessionId);
    
    // Отписываемся от Realtime
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }
    
    setSessionId(null);
    setMessages([]);
    
    toast({
      title: 'Сессия завершена',
      description: 'Ваша беседа сохранена в истории',
    });
  };
  
  // Клик по suggestion
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  return {
    messages,
    sessionId,
    isLoading,
    isTyping,
    sendMessage,
    startNewSession,
    endSession,
    handleSuggestionClick
  };
}
