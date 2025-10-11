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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
