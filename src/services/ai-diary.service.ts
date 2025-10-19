import { supabase } from '@/integrations/supabase/client';

export interface DiaryMessage {
  id: string;
  user_id: string;
  session_id: string;
  message_type: 'user' | 'ai' | 'system';
  message?: string;
  ai_response?: string;
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
  created_at: string;
}

interface SendMessageParams {
  userJwt: string;
  user_id: string;
  message: string;
  session_id: string | null;
  locale?: string;
}

interface AIResponse {
  success: boolean;
  message?: string;
  data?: {
    session_id: string;
    ai_response: string;
    suggestions?: string[];
    emotions?: any;
    analysis?: any;
    saved_entry_id: string;
    timestamp: string;
  };
}

const WEBHOOK_URL = 'https://mentalbalans.com/webhook';

class AIDiaryService {
  /**
   * Отправить сообщение в AI дневник
   */
  async sendMessage(params: SendMessageParams): Promise<AIResponse> {
    try {
      console.log('📤 Sending message to webhook:', {
        user_id: params.user_id,
        session_id: params.session_id || 'NEW SESSION',
        message_length: params.message.length
      });
      
      const response = await fetch(`${WEBHOOK_URL}/ai-diary-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userJwt: params.userJwt,
          user_id: params.user_id,
          message: params.message,
          session_id: params.session_id,
          locale: params.locale || 'ru'
        })
      });
      
      // Детальная обработка HTTP ошибок
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
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
      console.log('📥 Raw response length:', responseText.length);
      
      // Проверяем что ответ не пустой
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Сервер вернул пустой ответ');
      }
      
      // Парсим JSON
      let data: AIResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Response preview:', responseText.substring(0, 500));
        throw new Error('Сервер вернул некорректный формат данных');
      }
      
      // Валидация структуры ответа
      if (!data.success) {
        throw new Error('API вернул ошибку: ' + (data.message || 'Unknown error'));
      }
      
      if (!data.data || !data.data.ai_response) {
        throw new Error('Отсутствует ответ AI в данных');
      }
      
      console.log('✅ Webhook success:', {
        session_id: data.data.session_id,
        response_length: data.data.ai_response.length,
        suggestions_count: data.data.suggestions?.length || 0
      });
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      
      // Понятные сообщения для пользователя
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Нет подключения к серверу');
      } else if (error.message.includes('NetworkError')) {
        throw new Error('Проблема с сетью. Проверьте интернет.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Превышено время ожидания. Попробуйте ещё раз.');
      }
      
      throw error;
    }
  }

  /**
   * Получить текущий session_id из localStorage
   */
  getCurrentSessionId(): string | null {
    return localStorage.getItem('ai_diary_session_id');
  }

  /**
   * Сохранить session_id в localStorage
   */
  setCurrentSessionId(sessionId: string): void {
    localStorage.setItem('ai_diary_session_id', sessionId);
  }

  /**
   * Очистить session_id из localStorage
   */
  clearCurrentSessionId(): void {
    localStorage.removeItem('ai_diary_session_id');
  }
}

export const aiDiaryService = new AIDiaryService();
