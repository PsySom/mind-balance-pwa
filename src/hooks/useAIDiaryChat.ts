import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { aiDiarySessionsService } from '@/services/ai-diary-sessions.service';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { config } from '@/lib/config';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: string;
  suggestions?: string[];
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

type SessionStatus = 'loading' | 'active' | 'error';

export function useAIDiaryChat() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
  const fallbackTimeoutRef = useRef<NodeJS.Timeout>();

  // WELCOME MESSAGE
  const WELCOME_MESSAGE: ChatMessage = {
    id: 'welcome',
    content: 'Привет! Я твой AI-помощник по ментальному здоровью. Расскажи, что у тебя на душе?',
    type: 'system',
    timestamp: new Date().toISOString(),
    suggestions: [
      '💭 Расскажу о своём дне',
      '😔 Чувствую тревогу',
      '🤔 Хочу разобраться в себе',
      '😊 Поделюсь радостью'
    ]
  };

  // ИНИЦИАЛИЗАЦИЯ СЕССИИ
  useEffect(() => {
    const initSession = async () => {
      if (!user?.id) return;
      
      try {
        setSessionStatus('loading');
        
        const savedSessionId = localStorage.getItem('ai_diary_session_id');
        
        if (savedSessionId) {
          console.log('🔍 Checking saved session:', savedSessionId);
          
          const isValid = await aiDiarySessionsService.validateSession(
            savedSessionId,
            user.id
          );
          
          if (isValid) {
            console.log('✅ Session is valid, loading history');
            setSessionId(savedSessionId);
            await loadSessionHistory(savedSessionId);
          } else {
            console.log('⚠️ Session invalid, clearing');
            localStorage.removeItem('ai_diary_session_id');
            setMessages([WELCOME_MESSAGE]);
          }
        } else {
          console.log('📝 No saved session, showing welcome');
          setMessages([WELCOME_MESSAGE]);
        }
        
        setSessionStatus('active');
      } catch (error) {
        console.error('❌ Session init error:', error);
        setSessionStatus('error');
        setMessages([WELCOME_MESSAGE]);
        toast.error('Ошибка загрузки сессии');
      }
    };
    
    initSession();
  }, [user?.id]);

  // ЗАГРУЗКА ИСТОРИИ СЕССИИ
  const loadSessionHistory = async (sid: string) => {
    try {
      const history = await aiDiarySessionsService.getSessionMessages(sid);
      
      if (history.length === 0) {
        setMessages([WELCOME_MESSAGE]);
        return;
      }
      
      const chatMessages: ChatMessage[] = [];
      
      history.forEach((msg) => {
        // User message
        if (msg.message) {
          chatMessages.push({
            id: `${msg.id}-user`,
            content: msg.message,
            type: 'user',
            timestamp: msg.created_at
          });
        }
        
        // AI response
        if (msg.ai_response) {
          chatMessages.push({
            id: msg.id,
            content: msg.ai_response,
            type: 'ai',
            timestamp: msg.created_at,
            suggestions: msg.suggestions || [],
            emotions: msg.emotions,
            analysis: msg.analysis
          });
        }
      });
      
      setMessages(chatMessages);
      console.log('✅ Loaded', chatMessages.length, 'messages');
      
    } catch (error) {
      console.error('❌ Load history error:', error);
      toast.error('Не удалось загрузить историю');
      setMessages([WELCOME_MESSAGE]);
    }
  };

  // REALTIME ПОДПИСКА
  useEffect(() => {
    if (!sessionId || !supabase) return;
    
    console.log('🔄 Setting up Realtime for session:', sessionId);
    
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
    }
    
    const channel = supabase
      .channel(`ai_diary_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_diary_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📨 Realtime event:', payload.eventType);
          
          const newMessage = payload.new as any;
          
          if (newMessage.message_type === 'ai') {
            handleNewAIMessage(newMessage);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to Realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error');
        }
      });
    
    setRealtimeChannel(channel);
    
    return () => {
      console.log('🔌 Unsubscribing from Realtime');
      channel.unsubscribe();
    };
  }, [sessionId]);

  // ОБРАБОТКА НОВОГО AI СООБЩЕНИЯ ИЗ REALTIME
  const handleNewAIMessage = (dbMessage: any) => {
    // Очищаем fallback таймер
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
    }
    
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === dbMessage.id);
      if (exists) {
        console.log('⚠️ Message already exists:', dbMessage.id);
        return prev;
      }
      
      const aiMessage: ChatMessage = {
        id: dbMessage.id,
        content: dbMessage.ai_response,
        type: 'ai',
        timestamp: dbMessage.created_at,
        suggestions: dbMessage.suggestions || [],
        emotions: dbMessage.emotions,
        analysis: dbMessage.analysis
      };
      
      console.log('✅ Adding AI message from Realtime:', aiMessage.id);
      
      // Typing effect для длинных сообщений
      if (aiMessage.content.length > 100) {
        setIsTyping(true);
        typeMessage(aiMessage).then(() => setIsTyping(false));
        return prev;
      }
      
      return [...prev, aiMessage];
    });
  };

  // TYPING EFFECT
  const typeMessage = async (message: ChatMessage) => {
    const words = message.content.split(' ');
    
    if (words.length < 20) {
      setMessages((prev) => [...prev, message]);
      return;
    }
    
    let displayedContent = '';
    const tempMessage = { ...message, content: '' };
    
    setMessages((prev) => [...prev, tempMessage]);
    
    for (let i = 0; i < words.length; i++) {
      displayedContent += (i === 0 ? '' : ' ') + words[i];
      
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? { ...m, content: displayedContent } : m
        )
      );
    }
  };

  // ОТПРАВКА СООБЩЕНИЯ
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !session || !user) return;
    
    const tempId = `temp-${Date.now()}`;
    
    try {
      setIsLoading(true);
      
      // 1. Optimistic UI
      const userMessage: ChatMessage = {
        id: tempId,
        content: messageText.trim(),
        type: 'user',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMessage]);
      
      // 2. Отправка на webhook
      console.log('📤 Sending to webhook:', {
        url: config.webhooks.diary,
        user_id: user.id,
        session_id: sessionId || 'NEW',
        message_preview: messageText.substring(0, 30) + '...'
      });
      
      const response = await fetch(`${config.webhooks.diary}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userJwt: session.access_token,
          user_id: user.id,
          message: messageText.trim(),
          session_id: sessionId,
          locale: 'ru'
        })
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      // Детальная обработка HTTP ошибок
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200)
        });
        
        if (response.status === 500) {
          throw new Error('Сервер временно недоступен. Попробуйте позже.');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Ошибка авторизации. Перезайдите в приложение.');
        } else if (response.status === 400) {
          throw new Error('Некорректный запрос. Проверьте данные.');
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Получаем текст ответа
      const responseText = await response.text();
      console.log('📥 Raw response:', {
        length: responseText.length,
        preview: responseText.substring(0, 200)
      });
      
      // Проверяем что ответ не пустой
      if (!responseText || responseText.trim().length === 0) {
        console.error('❌ Empty response from webhook');
        throw new Error('Сервер вернул пустой ответ. Проверьте настройки n8n workflow.');
      }
      
      // Парсим JSON
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Сервер вернул некорректный формат данных (не JSON)');
      }
      
      console.log('✅ Parsed webhook response:', {
        success: data.success,
        session_id: data.data?.session_id,
        has_ai_response: !!data.data?.ai_response,
        ai_response_length: data.data?.ai_response?.length || 0,
        suggestions_count: data.data?.suggestions?.length || 0
      });
      
      if (!data.success) {
        throw new Error(data.message || 'API вернул ошибку');
      }
      
      if (!data.data || !data.data.ai_response) {
        console.error('❌ Missing ai_response in data:', data);
        throw new Error('Отсутствует ответ AI в данных');
      }
      
      const responseData = data.data;
      
      // 3. Обновление session_id для новой сессии
      if (responseData.session_id && responseData.session_id !== sessionId) {
        console.log('🆕 New session created:', responseData.session_id);
        setSessionId(responseData.session_id);
        localStorage.setItem('ai_diary_session_id', responseData.session_id);
      }
      
      // 4. Заменяем временный ID на реальный
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, id: `${responseData.saved_entry_id}-user` }
            : msg
        )
      );
      
      // 5. Fallback через 30 секунд если Realtime не сработал
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      
      fallbackTimeoutRef.current = setTimeout(() => {
        setMessages((prev) => {
          const hasAIResponse = prev.some(
            (m) => m.type === 'ai' && m.timestamp > userMessage.timestamp
          );
          
          if (!hasAIResponse) {
            console.warn('⏰ Realtime timeout - using fallback');
            const aiMessage: ChatMessage = {
              id: responseData.saved_entry_id,
              content: responseData.ai_response,
              type: 'ai',
              timestamp: responseData.timestamp,
              suggestions: responseData.suggestions,
              emotions: responseData.emotions,
              analysis: responseData.analysis
            };
            return [...prev, aiMessage];
          }
          
          return prev;
        });
        setIsTyping(false);
      }, 30000);
      
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      
      if (error.message.includes('Failed to fetch')) {
        toast.error('Нет подключения к серверу');
      } else if (error.message.includes('500')) {
        toast.error('Ошибка сервера. Попробуйте позже');
      } else if (error.message.includes('авторизации')) {
        toast.error(error.message);
      } else {
        toast.error('Не удалось отправить сообщение');
      }
      
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  // НОВАЯ СЕССИЯ
  const startNewSession = async () => {
    try {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
      
      if (sessionId) {
        await aiDiarySessionsService.endSession(sessionId);
      }
      
      localStorage.removeItem('ai_diary_session_id');
      setSessionId(null);
      setMessages([WELCOME_MESSAGE]);
      
      toast.success('Новая сессия создана');
    } catch (error) {
      console.error('❌ Start new session error:', error);
      toast.error('Не удалось создать новую сессию');
    }
  };

  // ЗАВЕРШЕНИЕ СЕССИИ
  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await aiDiarySessionsService.endSession(sessionId);
      
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
      
      localStorage.removeItem('ai_diary_session_id');
      setSessionId(null);
      setMessages([WELCOME_MESSAGE]);
      
      toast.success('Сессия завершена');
    } catch (error) {
      console.error('❌ End session error:', error);
      toast.error('Не удалось завершить сессию');
    }
  };

  // КЛИК ПО SUGGESTION
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    isTyping,
    sessionStatus,
    realtimeChannel,
    sendMessage,
    startNewSession,
    endSession,
    handleSuggestionClick
  };
}
