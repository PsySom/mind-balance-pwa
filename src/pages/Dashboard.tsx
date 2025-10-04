import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, BookOpen, Activity, Calendar, History, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIDiaryChat from '@/components/AIDiaryChat';
import TrackersDashboard from '@/components/TrackersDashboard';
import PlannerDashboard from '@/components/PlannerDashboard';
import HistoryDashboard from '@/components/HistoryDashboard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Вы вышли из аккаунта',
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-soft)' }}>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            PsyBalance
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <SettingsIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Выход
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto h-14">
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Дневник</span>
            </TabsTrigger>
            <TabsTrigger value="trackers" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Трекеры</span>
            </TabsTrigger>
            <TabsTrigger value="planner" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Планировщик</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="space-y-4">
            <AIDiaryChat />
          </TabsContent>

          <TabsContent value="trackers" className="space-y-4">
            <TrackersDashboard />
          </TabsContent>

          <TabsContent value="planner" className="space-y-4">
            <PlannerDashboard />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <HistoryDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
