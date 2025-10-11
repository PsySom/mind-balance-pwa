import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, StopCircle, Clock, MessageCircle } from 'lucide-react';
import { DiarySession } from '@/services/ai-diary-sessions.service';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FreeChatHeaderProps {
  currentSession: DiarySession | null;
  onNewSession: () => void;
  onEndSession: () => void;
}

export default function FreeChatHeader({
  currentSession,
  onNewSession,
  onEndSession
}: FreeChatHeaderProps) {
  return (
    <div className="border-b p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">AI Дневник</h2>
          {currentSession && (
            <Badge variant="secondary" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Активная сессия
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {currentSession && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
              className="gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Завершить
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onNewSession}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Новая сессия
          </Button>
        </div>
      </div>

      {currentSession && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              Начата: {format(new Date(currentSession.started_at), 'dd MMM, HH:mm', { locale: ru })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{currentSession.message_count} сообщений</span>
          </div>
        </div>
      )}
    </div>
  );
}
