import { Card } from '@/components/ui/card';
import { useAIDiaryAnalytics } from '@/hooks/useAIDiaryAnalytics';
import { MessageCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIDiaryStats() {
  const { stats, isLoading } = useAIDiaryAnalytics();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Статистика пока недоступна. Начните вести дневник!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Статистика дневника</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Всего сессий</span>
          </div>
          <p className="text-2xl font-bold">{stats.total_sessions}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Сообщений</span>
          </div>
          <p className="text-2xl font-bold">{stats.total_messages}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Средняя длительность</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.round(stats.avg_session_duration)} мин
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Сообщений/сессия</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.avg_messages_per_session.toFixed(1)}
          </p>
        </div>
      </div>

      {stats.top_emotions && Object.keys(stats.top_emotions).length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Самые частые эмоции</h4>
          <div className="space-y-2">
            {Object.entries(stats.top_emotions)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([emotion, count]) => (
                <div key={emotion} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{emotion}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
