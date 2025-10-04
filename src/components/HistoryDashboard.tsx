import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Activity } from 'lucide-react';
import DiaryHistory from './DiaryHistory';
import TrackerHistoryFromSupabase from './TrackerHistoryFromSupabase';

export default function HistoryDashboard() {
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');

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

  if (!userId || !userJwt) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">История</h2>

      <Tabs defaultValue="diary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="diary" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Дневник
          </TabsTrigger>
          <TabsTrigger value="trackers" className="gap-2">
            <Activity className="w-4 h-4" />
            Трекеры
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diary">
          <DiaryHistory userId={userId} userJwt={userJwt} />
        </TabsContent>

        <TabsContent value="trackers">
          <TrackerHistoryFromSupabase userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
