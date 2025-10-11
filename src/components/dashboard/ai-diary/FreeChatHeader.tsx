import { Button } from '@/components/ui/button';
import { MessageSquarePlus, X } from 'lucide-react';

interface FreeChatHeaderProps {
  sessionId: string | null;
  onNewSession: () => void;
  onEndSession: () => void;
}

export default function FreeChatHeader({ 
  sessionId, 
  onNewSession, 
  onEndSession 
}: FreeChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Свободное общение с AI</h2>
        {sessionId && (
          <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
            Активная сессия
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onNewSession}
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Новая сессия
        </Button>
        
        {sessionId && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onEndSession}
          >
            <X className="w-4 h-4 mr-2" />
            Завершить
          </Button>
        )}
      </div>
    </div>
  );
}
