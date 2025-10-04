import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { config } from '@/lib/config';

interface TrackerRecord {
  id: string;
  mood: number;
  stress: number;
  energy: number;
  process_satisfaction: number;
  result_satisfaction: number;
  note?: string;
  timestamp: string;
}

interface TrackerHistoryFromSupabaseProps {
  userId: string;
  userJwt: string;
}

export default function TrackerHistoryFromSupabase({ userId, userJwt }: TrackerHistoryFromSupabaseProps) {
  const [records, setRecords] = useState<TrackerRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TrackerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('7');

  useEffect(() => {
    fetchRecords();
  }, [userId, userJwt]);

  useEffect(() => {
    filterRecords();
  }, [records, dateFilter]);

  const fetchRecords = async () => {
    if (!userId || !userJwt) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.supabase.url}/rest/v1/tracker_records?user_id=eq.${userId}&order=timestamp.desc&limit=20`,
        {
          headers: {
            'apikey': config.supabase.anonKey,
            'Authorization': `Bearer ${userJwt}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при загрузке записей');
      }

      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching tracker records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const cutoffDate = subDays(new Date(), days);
      filtered = filtered.filter(record => 
        new Date(record.timestamp) >= cutoffDate
      );
    }

    setFilteredRecords(filtered);
  };

  const getBarColor = (value: number) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const trackerLabels = [
    { key: 'mood', label: 'Настроение' },
    { key: 'stress', label: 'Стресс' },
    { key: 'energy', label: 'Энергия' },
    { key: 'process_satisfaction', label: 'Удовл. процессом' },
    { key: 'result_satisfaction', label: 'Удовл. результатом' },
  ];

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-muted-foreground">Загрузка записей...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Период</Label>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Последние 7 дней</SelectItem>
            <SelectItem value="30">Последние 30 дней</SelectItem>
            <SelectItem value="all">Все время</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRecords.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Записи не найдены</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Collapsible key={record.id}>
              <Card className="p-4">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(record.timestamp), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </span>
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {trackerLabels.map(({ key }) => {
                          const value = record[key as keyof TrackerRecord] as number;
                          return (
                            <div key={key} className="space-y-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getBarColor(value)}`}
                                  style={{ width: `${value * 10}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 mt-4 border-t border-border space-y-3">
                  <div className="grid gap-2">
                    {trackerLabels.map(({ key, label }) => {
                      const value = record[key as keyof TrackerRecord] as number;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">{value}/10</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getBarColor(value)} transition-all`}
                              style={{ width: `${value * 10}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {record.note && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Заметка:</p>
                      <p className="text-sm">{record.note}</p>
                    </div>
                  )}
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
