import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronDown, Calendar, Loader2, AlertCircle, Smile, Frown, Flame, XCircle, Shield, Sparkles, Clock } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { config } from '@/lib/config';
import EmotionBadge from './EmotionBadge';

interface DiaryEntry {
  id: string;
  message: string;
  ai_response: string;
  emotions?: {
    primary: string;
    intensity: string;
    triggers: string[];
  };
  analysis?: {
    cognitive_distortions: string[];
    themes: string[];
    mood_score: number;
  };
  created_at: string;
}

interface DiaryHistoryProps {
  userId: string;
  userJwt: string;
}

const emotionConfig: Record<string, { name: string; icon: any; color: string }> = {
  fear: { name: 'Страх', icon: AlertCircle, color: 'text-purple-500' },
  joy: { name: 'Радость', icon: Smile, color: 'text-yellow-500' },
  sadness: { name: 'Грусть', icon: Frown, color: 'text-blue-500' },
  anger: { name: 'Гнев', icon: Flame, color: 'text-red-500' },
  disgust: { name: 'Отвращение', icon: XCircle, color: 'text-green-500' },
  trust: { name: 'Доверие', icon: Shield, color: 'text-teal-500' },
  surprise: { name: 'Удивление', icon: Sparkles, color: 'text-pink-500' },
  anticipation: { name: 'Предвкушение', icon: Clock, color: 'text-orange-500' },
};

const cognitiveDistortionLabels: Record<string, string> = {
  catastrophizing: 'Катастрофизация',
  black_white_thinking: 'Черно-белое мышление',
  overgeneralization: 'Сверхобобщение',
  mind_reading: 'Чтение мыслей',
  personalization: 'Персонализация',
};

const getMoodScoreColor = (score: number): string => {
  if (score <= 3) return 'text-red-500 bg-red-500/10 border-red-500/20';
  if (score <= 6) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  return 'text-green-500 bg-green-500/10 border-green-500/20';
};

export default function DiaryHistory({ userId, userJwt }: DiaryHistoryProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('7');
  const [emotionFilter, setEmotionFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');

  useEffect(() => {
    fetchEntries();
  }, [userId, userJwt]);

  useEffect(() => {
    filterEntries();
  }, [entries, dateFilter, emotionFilter, moodFilter]);

  const fetchEntries = async () => {
    if (!userId || !userJwt) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.supabase.url}/rest/v1/ai_diary_messages?user_id=eq.${userId}&order=created_at.desc&limit=20`,
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
      setEntries(data);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Фильтр по датам
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const cutoffDate = subDays(new Date(), days);
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) >= cutoffDate
      );
    }

    // Фильтр по эмоциям
    if (emotionFilter !== 'all') {
      filtered = filtered.filter(entry => 
        entry.emotions?.primary === emotionFilter
      );
    }

    // Фильтр по mood score
    if (moodFilter !== 'all') {
      const [min, max] = moodFilter.split('-').map(Number);
      filtered = filtered.filter(entry => {
        const score = entry.analysis?.mood_score;
        return score !== undefined && score >= min && score <= max;
      });
    }

    setFilteredEntries(filtered);
  };

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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Период</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Последние 7 дней</SelectItem>
              <SelectItem value="30">Последние 30 дней</SelectItem>
              <SelectItem value="all">Все время</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Эмоция</Label>
          <Select value={emotionFilter} onValueChange={setEmotionFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все эмоции</SelectItem>
              {Object.entries(emotionConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Настроение</Label>
          <Select value={moodFilter} onValueChange={setMoodFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой уровень</SelectItem>
              <SelectItem value="1-3">Низкое (1-3)</SelectItem>
              <SelectItem value="4-6">Среднее (4-6)</SelectItem>
              <SelectItem value="7-10">Высокое (7-10)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Записи не найдены</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <Collapsible key={entry.id}>
              <Card className="p-4">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(entry.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </span>
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      </div>
                      <p className="text-sm line-clamp-2">
                        {entry.message.slice(0, 100)}
                        {entry.message.length > 100 && '...'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.emotions?.primary && (
                          <EmotionBadge
                            emotion={entry.emotions.primary}
                            intensity={(entry.emotions.intensity as 'low' | 'moderate' | 'high') || 'moderate'}
                            size="sm"
                          />
                        )}
                        {entry.analysis?.mood_score !== undefined && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getMoodScoreColor(entry.analysis.mood_score)}`}
                          >
                            Настроение: {entry.analysis.mood_score}/10
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 mt-4 border-t border-border space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Ваше сообщение:</h4>
                    <p className="text-sm text-muted-foreground">{entry.message}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Ответ AI:</h4>
                    <p className="text-sm">{entry.ai_response}</p>
                  </div>
                  
                  {entry.analysis && (
                    <Collapsible className="space-y-2">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                        <ChevronDown className="w-4 h-4" />
                        <span>Анализ</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-2">
                        {entry.analysis.mood_score !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Оценка настроения:</Label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getMoodScoreColor(entry.analysis.mood_score).split(' ')[0].replace('text-', 'bg-')}`}
                                  style={{ width: `${entry.analysis.mood_score * 10}%` }}
                                />
                              </div>
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getMoodScoreColor(entry.analysis.mood_score)}`}
                              >
                                {entry.analysis.mood_score}/10
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {entry.analysis.cognitive_distortions && entry.analysis.cognitive_distortions.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Когнитивные искажения:</Label>
                            <div className="flex flex-wrap gap-1">
                              {entry.analysis.cognitive_distortions.map((distortion, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {cognitiveDistortionLabels[distortion] || distortion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {entry.analysis.themes && entry.analysis.themes.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Ключевые темы:</Label>
                            <div className="flex flex-wrap gap-1">
                              {entry.analysis.themes.map((theme, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
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
