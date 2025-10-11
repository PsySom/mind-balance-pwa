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
    
    console.log('[AI Diary] Подписка на Realtime для сессии:', sessId);
    
    realtimeChannelRef.current = aiDiarySessionsService.subscribeToSession(
      sessId,
      (newMessage) => {
        console.log('[AI Diary] Получено новое сообщение через Realtime:', newMessage);
        handleNewAIMessage(newMessage);
      }
    );
  };
  
  // Обработчик нового AI сообщения через Realtime
  const handleNewAIMessage = useCallback((aiMessageData: any) => {
    // Очищаем fallback таймер если он был
    if ((window as any).__fallbackTimer) {
      clearTimeout((window as any).__fallbackTimer);
      delete (window as any).__fallbackTimer;
    }
    
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
    
    setMessages(prev => {
      // Проверяем, не добавили ли уже это сообщение (через fallback)
      const exists = prev.find(m => m.id === aiMessage.id);
      if (exists) return prev;
      return [...prev, aiMessage];
    });
    
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
        
        // FALLBACK: если через N секунд нет ответа через Realtime, добавляем вручную
        const isMock = Boolean(
          response?.data?.is_mock ||
          response?.data?.session_id?.startsWith?.('mock_session_') ||
          response?.data?.saved_entry_id?.startsWith?.('mock_')
        );
        const timeoutMs = isMock ? 1200 : 30000;
        
        const fallbackTimeout = setTimeout(() => {
          if (response.data.ai_response) {
            const aiMessage: ChatMessage = {
              id: response.data.saved_entry_id || `ai_${Date.now()}`,
              type: 'ai',
              content: response.data.ai_response,
              suggestions: response.data.suggestions || [],
              emotions: response.data.emotions,
              analysis: response.data.analysis,
              timestamp: response.data.timestamp || new Date().toISOString()
            };
            
            setMessages(prev => {
              // Проверяем, не добавили ли уже это сообщение
              const exists = prev.find(m => m.id === aiMessage.id);
              if (exists) return prev;
              return [...prev, aiMessage];
            });
            
            setIsTyping(false);
          }
        }, timeoutMs);
        
        // Сохраняем таймер для очистки
        (window as any).__fallbackTimer = fallbackTimeout;
      }
    } catch (error: any) {
      console.error('[AI Diary] Ошибка отправки сообщения:', error);
      
      // Удаляем сообщение пользователя при ошибке
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      // Очищаем fallback таймер
      if ((window as any).__fallbackTimer) {
        clearTimeout((window as any).__fallbackTimer);
        delete (window as any).__fallbackTimer;
      }
      
      // Показываем конкретную ошибку пользователю
      const errorMessage = error?.message || 'Не удалось отправить сообщение';
      toast({
        title: 'Ошибка отправки',
        description: errorMessage.includes('webhook') 
          ? 'Проблема с сервером. Попробуйте позже.' 
          : errorMessage,
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
    // Сразу подписываемся на Realtime для новой сессии
    subscribeToSession(newSession.session_id);
    
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
    
    // Очищаем fallback таймер если есть
    if ((window as any).__fallbackTimer) {
      clearTimeout((window as any).__fallbackTimer);
      delete (window as any).__fallbackTimer;
    }
    
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
