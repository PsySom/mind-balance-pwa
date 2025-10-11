import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { aiDiarySessionsService, SessionStats } from '@/services/ai-diary-sessions.service';

export function useAIDiaryAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const userStats = await aiDiarySessionsService.getUserStats(user.id);
        setStats(userStats);
      } catch (error) {
        console.error('Load stats error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
    
    // Обновляем статистику каждые 30 секунд
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  return { stats, isLoading };
}
