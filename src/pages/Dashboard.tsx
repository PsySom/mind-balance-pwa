import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import AIDiaryChat from '@/components/AIDiaryChat';
import TrackersDashboard from '@/components/TrackersDashboard';
import PlannerDashboard from '@/components/PlannerDashboard';
import HistoryDashboard from '@/components/HistoryDashboard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'journal';

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: 'var(--gradient-soft)' }}>
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-4 md:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <h1 
                  className="text-xl md:text-2xl font-bold bg-clip-text text-transparent" 
                  style={{ backgroundImage: 'var(--gradient-primary)' }}
                >
                  PsyBalance
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/settings')}
                  aria-label="Настройки"
                >
                  <SettingsIcon className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut} 
                  className="gap-2 hidden md:flex"
                >
                  <LogOut className="w-4 h-4" />
                  Выход
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
              <Tabs value={activeTab} className="space-y-6">
                <TabsList className="hidden">
                  <TabsTrigger value="journal">Дневник</TabsTrigger>
                  <TabsTrigger value="trackers">Трекеры</TabsTrigger>
                  <TabsTrigger value="planner">Планировщик</TabsTrigger>
                  <TabsTrigger value="history">История</TabsTrigger>
                  <TabsTrigger value="analytics">Аналитика</TabsTrigger>
                </TabsList>

                <TabsContent value="journal" className="animate-fade-in">
                  <AIDiaryChat />
                </TabsContent>

                <TabsContent value="trackers" className="animate-fade-in">
                  <TrackersDashboard />
                </TabsContent>

                <TabsContent value="planner" className="animate-fade-in">
                  <PlannerDashboard />
                </TabsContent>

                <TabsContent value="history" className="animate-fade-in">
                  <HistoryDashboard />
                </TabsContent>

                <TabsContent value="analytics" className="animate-fade-in">
                  <AnalyticsDashboard />
                </TabsContent>
              </Tabs>
            </div>
          </main>

          <BottomNavigation />
        </div>
      </div>
    </SidebarProvider>
  );
}
