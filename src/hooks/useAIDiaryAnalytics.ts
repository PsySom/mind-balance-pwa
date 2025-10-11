import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiDiarySessionsService, SessionStats, DiarySession } from '@/services/ai-diary-sessions.service';

export const useAIDiaryAnalytics = () => {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [sessions, setSessions] = useState<DiarySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      setUserId(session.user.id);

      try {
        // Загружаем статистику
        const userStats = await aiDiarySessionsService.getUserStats(session.user.id);
        setStats(userStats);

        // Загружаем последние сессии
        const userSessions = await aiDiarySessionsService.getUserSessions(session.user.id, 10);
        setSessions(userSessions);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const refreshAnalytics = async () => {
    if (!userId) return;
    
    try {
      const userStats = await aiDiarySessionsService.getUserStats(userId);
      setStats(userStats);

      const userSessions = await aiDiarySessionsService.getUserSessions(userId, 10);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  return {
    stats,
    sessions,
    isLoading,
    refreshAnalytics
  };
};
