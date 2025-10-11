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
        
        // Каждая запись в БД содержит ОБА сообщения: от пользователя и ответ AI
        const chatMessages: ChatMessage[] = [];
        history.forEach(msg => {
          // Добавляем сообщение пользователя
          if (msg.message) {
            chatMessages.push({
              id: `${msg.id}_user`,
              type: 'user',
              content: msg.message,
              timestamp: msg.created_at
            });
          }
          
          // Добавляем ответ AI
          if (msg.ai_response) {
            chatMessages.push({
              id: msg.id,
              type: 'ai',
              content: msg.ai_response,
              suggestions: msg.suggestions,
              emotions: msg.emotions,
              analysis: msg.analysis,
              timestamp: msg.created_at
            });
          }
        });
        
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
    console.group('📨 Realtime Message Received');
    console.log('Message ID:', aiMessageData.id);
    console.log('Session ID:', aiMessageData.session_id);
    console.log('User Message:', aiMessageData.message);
    console.log('AI Response:', aiMessageData.ai_response);
    console.log('Has Suggestions:', aiMessageData.suggestions?.length || 0);
    console.groupEnd();
    
    // Очищаем fallback таймер если он был
    if ((window as any).__fallbackTimer) {
      clearTimeout((window as any).__fallbackTimer);
      delete (window as any).__fallbackTimer;
    }
    
    setIsTyping(false);
    
    setMessages(prev => {
      // Проверяем, нет ли уже этого AI сообщения (защита от дубликатов)
      const aiExists = prev.find(m => m.id === aiMessageData.id);
      if (aiExists) return prev;
      
      // Одна запись БД = одна пара сообщений (user + AI)
      const userMessageId = `${aiMessageData.id}_user`;
      const userExists = prev.find(m => m.id === userMessageId);
      
      const newMessages = [...prev];
      
      // Добавляем user сообщение если его нет (может быть из optimistic update)
      if (!userExists && aiMessageData.message) {
        newMessages.push({
          id: userMessageId,
          type: 'user',
          content: aiMessageData.message,
          timestamp: aiMessageData.created_at
        });
      }
      
      // Добавляем AI сообщение с эффектом печати
      if (aiMessageData.ai_response) {
        newMessages.push({
          id: aiMessageData.id,
          type: 'ai',
          content: '',
          suggestions: aiMessageData.suggestions || [],
          emotions: aiMessageData.emotions,
          analysis: aiMessageData.analysis,
          timestamp: aiMessageData.created_at,
          isTyping: true
        });
        
        // Запускаем эффект печати
        setTimeout(() => typeMessage(aiMessageData.id, aiMessageData.ai_response), 0);
      }
      
      return newMessages;
    });
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
      console.group('🤖 AI Diary - Send Message');
      console.log('📤 Request:', {
        userId: user.id,
        sessionId: sessionId || 'new session',
        messageLength: messageText.length,
        timestamp: new Date().toISOString()
      });
      
      // Отправляем на backend
      const response = await aiDiaryService.sendMessage(
        session.access_token,
        user.id,
        messageText,
        sessionId,
        'ru'
      );
      
      console.log('📥 API Response:', {
        success: response?.success,
        hasData: !!response?.data,
        hasAiResponse: !!response?.data?.ai_response,
        hasSuggestions: response?.data?.suggestions?.length || 0,
        hasEmotions: !!response?.data?.emotions,
        savedEntryId: response?.data?.saved_entry_id,
        sessionId: response?.data?.session_id
      });
      console.groupEnd();
      
      // Валидация ответа от API
      if (!response || !response.data || typeof response.data !== 'object') {
        console.error('❌ Invalid API response format:', response);
        toast({
          title: 'Ошибка формата ответа',
          description: 'Сервер вернул некорректные данные',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      if (!response.success) {
        console.error('❌ API returned success=false:', response.data);
        toast({
          title: 'Ошибка сервера',
          description: 'Сервер вернул ошибку',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      // Проверка обязательных полей
      const requiredFields = ['ai_response', 'suggestions', 'emotions', 'analysis', 'session_id'];
      const missingFields = requiredFields.filter(field => !response.data[field]);
      
      if (missingFields.length > 0) {
        console.warn('⚠️ Missing fields in API response:', missingFields);
      }
      
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
          console.warn('⚠️ Realtime timeout - using fallback response');
          console.log('Fallback data:', {
            messageId: response.data.saved_entry_id,
            hasResponse: !!response.data.ai_response
          });
          
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
      console.group('❌ AI Diary Error');
      console.error('Error details:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Специфичные ошибки
        if (error.response.status === 401) {
          toast({
            title: 'Ошибка авторизации',
            description: 'Попробуйте перелогиниться',
            variant: 'destructive'
          });
        } else if (error.response.status === 500) {
          toast({
            title: 'Ошибка сервера',
            description: 'Попробуйте позже',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Ошибка отправки',
            description: `Статус: ${error.response.status}`,
            variant: 'destructive'
          });
        }
      } else if (error.request) {
        console.error('No response received');
        toast({
          title: 'Нет связи с сервером',
          description: 'Проверьте подключение к интернету',
          variant: 'destructive'
        });
      } else {
        console.error('Request setup error:', error.message);
        toast({
          title: 'Ошибка запроса',
          description: error.message,
          variant: 'destructive'
        });
      }
      
      console.groupEnd();
      
      // Удаляем сообщение пользователя при ошибке
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      // Очищаем fallback таймер
      if ((window as any).__fallbackTimer) {
        clearTimeout((window as any).__fallbackTimer);
        delete (window as any).__fallbackTimer;
      }
      
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
