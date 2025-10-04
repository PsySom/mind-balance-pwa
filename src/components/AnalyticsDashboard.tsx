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

const SUPABASE_URL = 'https://wzgmfdtqxtuzujipoimc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z21mZHRxeHR1enVqaXBvaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5Nzc5NzIsImV4cCI6MjA3NDU1Mzk3Mn0.6uBF_pdzy8PjSAPOvGwSonmWul8YYHBDwAMHz7Tytb8';

export default function AnalyticsDashboard() {
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('30');
  const [dataTypeFilter, setDataTypeFilter] = useState('all');

  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [trackerRecords, setTrackerRecords] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserJwt(session.access_token);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    if (userId && userJwt) {
      fetchData();
    }
  }, [userId, userJwt, periodFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    const days = parseInt(periodFilter);
    const cutoffDate = subDays(new Date(), days).toISOString();

    try {
      const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${userJwt}`,
      };

      if (dataTypeFilter === 'all' || dataTypeFilter === 'diary') {
        const diaryResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/ai_diary_messages?user_id=eq.${userId}&created_at=gte.${cutoffDate}&order=created_at.asc`,
          { headers }
        );
        if (diaryResponse.ok) {
          const data = await diaryResponse.json();
          setDiaryEntries(data);
        }
      }

      if (dataTypeFilter === 'all' || dataTypeFilter === 'trackers') {
        const trackerResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/tracker_records?user_id=eq.${userId}&timestamp=gte.${cutoffDate}&order=timestamp.asc`,
          { headers }
        );
        if (trackerResponse.ok) {
          const data = await trackerResponse.json();
          setTrackerRecords(data);
        }
      }

      if (dataTypeFilter === 'all' || dataTypeFilter === 'activities') {
        const activitiesResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/activities?user_id=eq.${userId}&date=gte.${cutoffDate.split('T')[0]}&order=date.asc`,
          { headers }
        );
        if (activitiesResponse.ok) {
          const data = await activitiesResponse.json();
          setActivities(data);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
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

  if (!userId || !userJwt) {
    return null;
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
