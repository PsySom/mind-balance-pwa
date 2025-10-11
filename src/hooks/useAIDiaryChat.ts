import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiDiaryService } from '@/services/ai-diary.service';
import { aiDiarySessionsService, DiarySession } from '@/services/ai-diary-sessions.service';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
  suggestions?: string[];
}

export const useAIDiaryChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<DiarySession | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();

  // Инициализация: получаем пользователя и сессию
  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserJwt(session.access_token);

        // Пробуем загрузить текущую сессию
        const existingSession = await aiDiarySessionsService.getCurrentSession(session.user.id);
        
        if (existingSession) {
          setCurrentSession(existingSession);
          // Загружаем сообщения из этой сессии
          const sessionMessages = await aiDiarySessionsService.getSessionMessages(existingSession.session_id);
          const formattedMessages = sessionMessages.map(msg => ({
            id: msg.id,
            role: msg.message_type === 'user' ? 'user' : 'assistant',
            content: msg.message_type === 'user' ? msg.message || '' : msg.ai_response || '',
            timestamp: msg.created_at,
            emotions: msg.emotions,
            analysis: msg.analysis,
            suggestions: msg.suggestions
          })) as ChatMessage[];
          setMessages(formattedMessages);
          
          // Устанавливаем suggestions из последнего AI сообщения
          const lastAiMessage = formattedMessages.filter(m => m.role === 'assistant').pop();
          if (lastAiMessage?.suggestions) {
            setSuggestions(lastAiMessage.suggestions);
          }
        }
      }
    };

    initChat();
  }, []);

  // Подписка на realtime обновления
  useEffect(() => {
    if (currentSession) {
      channelRef.current = aiDiarySessionsService.subscribeToSession(
        currentSession.session_id,
        (newMessage) => {
          // Добавляем новое сообщение от AI
          const chatMessage: ChatMessage = {
            id: newMessage.id,
            role: 'assistant',
            content: newMessage.ai_response || '',
            timestamp: newMessage.created_at,
            emotions: newMessage.emotions,
            analysis: newMessage.analysis,
            suggestions: newMessage.suggestions
          };
          setMessages(prev => [...prev, chatMessage]);
          
          if (newMessage.suggestions) {
            setSuggestions(newMessage.suggestions);
          }
          setIsLoading(false);
        }
      );
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentSession]);

  // Начать новую сессию
  const startNewSession = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Завершаем текущую сессию, если есть
      if (currentSession) {
        await aiDiarySessionsService.endSession(currentSession.session_id);
      }

      // Создаем новую сессию
      const newSession = await aiDiarySessionsService.createSession(userId);
      setCurrentSession(newSession);
      setMessages([]);
      setSuggestions([]);
      
      toast({
        title: 'Новая сессия начата',
        description: 'Можете начать новый диалог'
      });
    } catch (error) {
      console.error('Error starting new session:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось начать новую сессию',
        variant: 'destructive'
      });
    }
  }, [userId, currentSession, toast]);

  // Завершить текущую сессию
  const endCurrentSession = useCallback(async () => {
    if (!currentSession) return;
    
    try {
      await aiDiarySessionsService.endSession(currentSession.session_id);
      setCurrentSession(null);
      setMessages([]);
      setSuggestions([]);
      
      toast({
        title: 'Сессия завершена',
        description: 'Ваш диалог сохранен'
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить сессию',
        variant: 'destructive'
      });
    }
  }, [currentSession, toast]);

  // Отправить сообщение
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !userId || !userJwt) return;

    try {
      setIsLoading(true);

      // Если нет активной сессии, создаем новую
      let sessionId = currentSession?.session_id || null;
      if (!sessionId) {
        const newSession = await aiDiarySessionsService.createSession(userId);
        setCurrentSession(newSession);
        sessionId = newSession.session_id;
      }

      // Добавляем сообщение пользователя в UI
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Отправляем на бэкенд
      const response = await aiDiaryService.sendMessage(
        userJwt,
        userId,
        messageText,
        sessionId,
        'ru'
      );

      if (response.success) {
        const data = response.data;
        
        // Обновляем session_id если он изменился
        if (data.session_id !== sessionId) {
          aiDiaryService.setCurrentSessionId(data.session_id);
        }

        // Добавляем ответ AI
        const aiMessage: ChatMessage = {
          id: data.saved_entry_id || `ai-${Date.now()}`,
          role: 'assistant',
          content: data.ai_response,
          timestamp: data.timestamp,
          emotions: data.emotions,
          analysis: data.analysis,
          suggestions: data.suggestions
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Обновляем suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, userJwt, currentSession, toast]);

  return {
    messages,
    isLoading,
    suggestions,
    currentSession,
    sendMessage,
    startNewSession,
    endCurrentSession
  };
};
