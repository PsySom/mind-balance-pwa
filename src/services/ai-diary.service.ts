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
    
    // ВРЕМЕННО: Mock ответ для тестирования UI
    const USE_MOCK = true; // ⚠️ Переключите на false когда n8n заработает
    
    if (USE_MOCK) {
      console.log('🎭 Using MOCK response for testing');
      
      // Имитация задержки сети (как будто ждем AI)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Генерируем адаптивный ответ в зависимости от сообщения
      const isStress = message.toLowerCase().includes('стресс') || 
                       message.toLowerCase().includes('тревог');
      const isJoy = message.toLowerCase().includes('рад') || 
                    message.toLowerCase().includes('счастлив');
      
      let aiResponse = '';
      let suggestions = [];
      let emotion = 'trust';
      let moodScore = 5;
      
      if (isStress) {
        aiResponse = 'Я понимаю, что вы испытываете стресс. Это непростое состояние. Расскажите, что именно вас сейчас беспокоит больше всего?';
        suggestions = [
          '🧘 Как справиться со стрессом?',
          '😌 Покажи технику релаксации',
          '📝 Расскажу что беспокоит подробнее',
          '💭 Что я могу сделать прямо сейчас?'
        ];
        emotion = 'fear';
        moodScore = 4;
      } else if (isJoy) {
        aiResponse = 'Как замечательно слышать о вашей радости! Поделитесь, что именно вас так порадовало?';
        suggestions = [
          '🎉 Расскажу что меня порадовало',
          '💪 Хочу поделиться успехом',
          '🎯 Как сохранить это состояние?',
          '✨ Планирую развивать дальше'
        ];
        emotion = 'joy';
        moodScore = 8;
      } else {
        aiResponse = 'Спасибо, что поделились. Я здесь, чтобы выслушать и поддержать вас. О чем хотели бы поговорить?';
        suggestions = [
          '😊 Расскажу о своих мыслях',
          '🤔 Хочу разобраться в чувствах',
          '💬 Поговорим о планах',
          '🌟 Что меня вдохновляет'
        ];
        emotion = 'trust';
        moodScore = 6;
      }
      
      // Mock ответ в формате API
      return {
        success: true,
        data: {
          session_id: sessionId || `mock_session_${Date.now()}`,
          ai_response: aiResponse,
          suggestions: suggestions,
          emotions: {
            primary: emotion,
            intensity: 'moderate',
            triggers: message.split(' ').slice(0, 3)
          },
          analysis: {
            cognitive_distortions: isStress ? ['catastrophizing'] : [],
            themes: ['общение', 'самопознание'],
            mood_score: moodScore
          },
          saved_entry_id: `mock_entry_${Date.now()}`,
          locale: locale,
          timestamp: new Date().toISOString(),
          is_mock: true
        }
      };
    }
    
    // Реальный запрос к webhook (когда USE_MOCK = false)
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
