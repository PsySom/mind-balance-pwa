import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  message?: string;
}

export function ErrorFallback({ error, onRetry, message }: ErrorFallbackProps) {
  return (
    <Card className="p-8 text-center animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-destructive/10 rounded-full">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Что-то пошло не так</h3>
          <p className="text-sm text-muted-foreground">
            {message || error?.message || 'Произошла ошибка при загрузке данных'}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </Button>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <Icon className="w-12 h-12 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}
