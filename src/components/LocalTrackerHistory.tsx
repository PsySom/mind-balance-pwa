import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrackerEntry {
  mood: number;
  stress: number;
  energy: number;
  process_satisfaction: number;
  result_satisfaction: number;
  note: string;
  timestamp: Date;
}

interface LocalTrackerHistoryProps {
  entries: TrackerEntry[];
}

export default function LocalTrackerHistory({ entries }: LocalTrackerHistoryProps) {

  const getBarColor = (value: number) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const MiniBar = ({ value, label }: { value: number; label: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(value)} transition-all`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );

  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Пока нет записей</p>
        <p className="text-sm text-muted-foreground mt-1">
          Заполните форму выше, чтобы начать отслеживание
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">История (последние 7 дней)</h3>
      {entries.map((entry, index) => (
        <Collapsible key={index}>
          <Card className="p-4">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(entry.timestamp, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(entry.mood)}`}
                          style={{ width: `${entry.mood * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Настр.</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(entry.stress)}`}
                          style={{ width: `${entry.stress * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Стресс</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(entry.energy)}`}
                          style={{ width: `${entry.energy * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Энерг.</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(entry.process_satisfaction)}`}
                          style={{ width: `${entry.process_satisfaction * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Проц.</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(entry.result_satisfaction)}`}
                          style={{ width: `${entry.result_satisfaction * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Рез.</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-3 animate-fade-in">
              <div className="grid gap-2">
                <MiniBar value={entry.mood} label="Настроение" />
                <MiniBar value={entry.stress} label="Стресс" />
                <MiniBar value={entry.energy} label="Энергия" />
                <MiniBar value={entry.process_satisfaction} label="Удовлетворённость процессом" />
                <MiniBar value={entry.result_satisfaction} label="Удовлетворённость результатом" />
              </div>
              {entry.note && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Заметка:</p>
                  <p className="text-sm">{entry.note}</p>
                </div>
              )}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
