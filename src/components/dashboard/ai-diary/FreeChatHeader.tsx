import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, StopCircle } from 'lucide-react';

interface FreeChatHeaderProps {
  hasActiveSession: boolean;
  onNewSession: () => void;
  onEndSession: () => void;
}

export default function FreeChatHeader({
  hasActiveSession,
  onNewSession,
  onEndSession
}: FreeChatHeaderProps) {
  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">AI Дневник</h2>
          {hasActiveSession && (
            <Badge variant="secondary" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Активная сессия
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveSession && (
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
    </div>
  );
}
