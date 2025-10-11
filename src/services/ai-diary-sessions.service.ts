import { supabase } from '@/integrations/supabase/client';

export interface DiarySession {
  id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  last_activity_at: string;
  message_count: number;
  session_duration_minutes: number;
  emotions_summary: Record<string, number>;
  themes: string[];
  avg_mood_score: number | null;
  status: 'active' | 'ended' | 'archived';
}

export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  avg_messages_per_session: number;
  total_messages: number;
  avg_session_duration: number;
  last_activity: string;
  top_emotions: Record<string, number>;
}

class AIDiarySessionsService {
  /**
   * Создать новую сессию
   */
  async createSession(userId: string): Promise<DiarySession> {
    const sessionId = `ai_diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('ai_diary_sessions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        started_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Сохраняем в localStorage
    localStorage.setItem('ai_diary_session_id', sessionId);
    
    return data;
  }

  /**
   * Получить текущую активную сессию
   */
  async getCurrentSession(userId: string): Promise<DiarySession | null> {
    const sessionId = localStorage.getItem('ai_diary_session_id');
    if (!sessionId) return null;

    const { data, error } = await supabase
      .from('ai_diary_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      // Сессия не найдена - очищаем localStorage
      localStorage.removeItem('ai_diary_session_id');
      return null;
    }

    return data;
  }

  /**
   * Завершить сессию
   */
  async endSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_diary_sessions')
      .update({
        ended_at: new Date().toISOString(),
        status: 'ended'
      })
      .eq('session_id', sessionId);

    if (error) throw error;

    // Очищаем localStorage
    localStorage.removeItem('ai_diary_session_id');
  }

  /**
   * Получить историю сообщений сессии
   */
  async getSessionMessages(sessionId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('ai_diary_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Получить список сессий пользователя
   */
  async getUserSessions(userId: string, limit: number = 20): Promise<DiarySession[]> {
    const { data, error } = await supabase
      .from('ai_diary_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Получить статистику пользователя
   */
  async getUserStats(userId: string): Promise<SessionStats | null> {
    const { data, error } = await supabase
      .from('v_user_diary_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Stats error:', error);
      return null;
    }

    return data;
  }

  /**
   * Подписаться на обновления сессии (Realtime)
   */
  subscribeToSession(
    sessionId: string,
    onNewMessage: (message: any) => void
  ) {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_diary_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new.message_type === 'ai') {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  }
}

export const aiDiarySessionsService = new AIDiarySessionsService();
