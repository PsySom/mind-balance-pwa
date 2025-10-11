import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, Heart, Activity as ActivityIcon, CheckCircle } from 'lucide-react';
import { subDays, format } from 'date-fns';
import MoodTrendChart from './MoodTrendChart';
import EmotionsPieChart from './EmotionsPieChart';
import TrackerTrendChart from './TrackerTrendChart';
import ActivitiesBarChart from './ActivitiesBarChart';
import { TrackerAnalyticsChart } from '@/components/analytics/TrackerAnalyticsChart';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AnalyticsDashboard() {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('30');
  const [dataTypeFilter, setDataTypeFilter] = useState('all');
  const { toast } = useToast();

  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [trackerRecords, setTrackerRecords] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, periodFilter, dataTypeFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    const days = parseInt(periodFilter);
    const cutoffDate = subDays(new Date(), days).toISOString();

    try {
      if (dataTypeFilter === 'all' || dataTypeFilter === 'diary') {
        const { data, error } = await supabase
          .from('ai_diary_messages')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', cutoffDate)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setDiaryEntries(data || []);
      } else {
        setDiaryEntries([]);
      }

      if (dataTypeFilter === 'all' || dataTypeFilter === 'trackers') {
        const { data, error } = await supabase
          .from('tracker_records')
          .select('*')
          .eq('user_id', userId)
          .gte('timestamp', cutoffDate)
          .order('timestamp', { ascending: true });
        
        if (error) throw error;
        setTrackerRecords(data || []);
      } else {
        setTrackerRecords([]);
      }

      if (dataTypeFilter === 'all' || dataTypeFilter === 'activities') {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', userId)
          .gte('date', cutoffDate.split('T')[0])
          .order('date', { ascending: true });
        
        if (error) throw error;
        setActivities(data || []);
      } else {
        setActivities([]);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки',
        description: error.message || 'Не удалось загрузить данные аналитики',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalEntries = diaryEntries.length + trackerRecords.length;
    
    const avgMoodScore = diaryEntries.length > 0
      ? (diaryEntries.reduce((sum, entry) => sum + (entry.analysis?.mood_score || 0), 0) / diaryEntries.length).toFixed(1)
      : '0';

    const emotionCounts: Record<string, number> = {};
    diaryEntries.forEach(entry => {
      if (entry.emotions?.primary) {
        emotionCounts[entry.emotions.primary] = (emotionCounts[entry.emotions.primary] || 0) + 1;
      }
    });
    const mostFrequentEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const completionRate = activities.length > 0
      ? ((completedActivities / activities.length) * 100).toFixed(0)
      : '0';

    return { totalEntries, avgMoodScore, mostFrequentEmotion, completionRate };
  };

  const getMoodTrendData = () => {
    return diaryEntries
      .filter(entry => entry.analysis?.mood_score)
      .map(entry => ({
        date: entry.created_at,
        mood_score: entry.analysis.mood_score,
      }));
  };

  const getEmotionsData = () => {
    const counts: Record<string, number> = {};
    diaryEntries.forEach(entry => {
      if (entry.emotions?.primary) {
        counts[entry.emotions.primary] = (counts[entry.emotions.primary] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([emotion, count]) => ({ emotion, count }));
  };

  const getTrackerTrendData = () => {
    const days = 7;
    const data: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayRecords = trackerRecords.filter(r => r.timestamp.startsWith(date));
      
      if (dayRecords.length > 0) {
        const avg = (key: string) => 
          dayRecords.reduce((sum, r) => sum + r[key], 0) / dayRecords.length;
        
        data.push({
          date,
          mood: avg('mood'),
          stress: avg('stress'),
          energy: avg('energy'),
          process_satisfaction: avg('process_satisfaction'),
          result_satisfaction: avg('result_satisfaction'),
        });
      }
    }
    return data;
  };

  const getActivitiesData = () => {
    const counts: Record<string, number> = {};
    activities
      .filter(a => a.status === 'completed')
      .forEach(activity => {
        counts[activity.category] = (counts[activity.category] || 0) + 1;
      });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  };

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const emotionLabels: Record<string, string> = {
    fear: 'Страх',
    joy: 'Радость',
    sadness: 'Грусть',
    anger: 'Гнев',
    disgust: 'Отвращение',
    trust: 'Доверие',
    surprise: 'Удивление',
    anticipation: 'Предвкушение',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Аналитика</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Период</Label>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="14">14 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
              <SelectItem value="90">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Тип данных</Label>
          <Select value={dataTypeFilter} onValueChange={setDataTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все данные</SelectItem>
              <SelectItem value="diary">Только дневник</SelectItem>
              <SelectItem value="trackers">Только трекеры</SelectItem>
              <SelectItem value="activities">Только активности</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-muted-foreground">Загрузка данных...</span>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                  <p className="text-2xl font-bold">{stats.totalEntries}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Heart className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Средний mood score</p>
                  <p className="text-2xl font-bold">{stats.avgMoodScore}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ActivityIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Частая эмоция</p>
                  <p className="text-2xl font-bold">
                    {emotionLabels[stats.mostFrequentEmotion] || stats.mostFrequentEmotion}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Выполнено активностей</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
              </div>
            </Card>
          </div>

          {(dataTypeFilter === 'all' || dataTypeFilter === 'trackers') && (
            <Card>
              <CardHeader>
                <CardTitle>Динамика показателей</CardTitle>
                <CardDescription>
                  Наведите на график, чтобы увидеть распределение показателей за конкретный день
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrackerAnalyticsChart userId={userId} days={parseInt(periodFilter)} />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {(dataTypeFilter === 'all' || dataTypeFilter === 'diary') && getMoodTrendData().length > 0 && (
              <MoodTrendChart data={getMoodTrendData()} />
            )}

            {(dataTypeFilter === 'all' || dataTypeFilter === 'diary') && getEmotionsData().length > 0 && (
              <EmotionsPieChart data={getEmotionsData()} />
            )}

            {(dataTypeFilter === 'all' || dataTypeFilter === 'trackers') && getTrackerTrendData().length > 0 && (
              <TrackerTrendChart data={getTrackerTrendData()} />
            )}

            {(dataTypeFilter === 'all' || dataTypeFilter === 'activities') && getActivitiesData().length > 0 && (
              <ActivitiesBarChart data={getActivitiesData()} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
