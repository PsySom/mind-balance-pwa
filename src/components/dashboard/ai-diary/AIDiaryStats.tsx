import { useAIDiaryAnalytics } from '@/hooks/useAIDiaryAnalytics';
import { Card } from '@/components/ui/card';
import { BarChart3, MessageSquare, Clock } from 'lucide-react';

interface AIDiaryStatsProps {
  sessionId: string | null;
}

export default function AIDiaryStats({ sessionId }: AIDiaryStatsProps) {
  const { stats, isLoading } = useAIDiaryAnalytics();
  
  if (isLoading || !stats) {
    return null;
  }
  
  return (
    <Card className="p-4 m-4 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        {/* Всего сессий */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Сессий</p>
            <p className="text-lg font-semibold">{stats.total_sessions}</p>
          </div>
        </div>
        
        {/* Среднее сообщений */}
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Ср. сообщений</p>
            <p className="text-lg font-semibold">
              {stats.avg_messages_per_session.toFixed(1)}
            </p>
          </div>
        </div>
        
        {/* Активные сессии */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Активных</p>
            <p className="text-lg font-semibold">{stats.active_sessions}</p>
          </div>
        </div>
      </div>
      
      {/* Топ эмоции */}
      {stats.top_emotions && Object.keys(stats.top_emotions).length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-1">Топ эмоции:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.top_emotions).slice(0, 3).map(([emotion, count]) => (
              <span 
                key={emotion}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
              >
                {emotion}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
