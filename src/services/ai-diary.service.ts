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

class AIDiaryService {
  /**
   * Отправить сообщение в AI дневник
   */
  async sendMessage(
    userJwt: string,
    userId: string,
    message: string,
    sessionId: string | null,
    locale: string = 'ru'
  ): Promise<any> {
    console.log('[AI Diary Service] Отправка сообщения:', { userId, sessionId, messageLength: message.length });
    
    const response = await fetch('https://mentalbalans.com/webhook/ai-diary-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userJwt,
        user_id: userId,
        message,
        session_id: sessionId,
        locale
      })
    });

    console.log('[AI Diary Service] Статус ответа:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Diary Service] Ошибка webhook:', errorText);
      throw new Error(`Webhook error! status: ${response.status}, message: ${errorText}`);
    }

    const text = await response.text();
    console.log('[AI Diary Service] Текст ответа:', text);
    
    if (!text || text.trim() === '') {
      console.error('[AI Diary Service] Пустой ответ от webhook');
      throw new Error('Webhook вернул пустой ответ');
    }

    try {
      const data = JSON.parse(text);
      console.log('[AI Diary Service] Распарсенный ответ:', data);
      return data;
    } catch (e) {
      console.error('[AI Diary Service] Ошибка парсинга JSON:', e, 'Текст:', text);
      throw new Error('Webhook вернул невалидный JSON');
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
