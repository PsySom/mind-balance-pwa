import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, BookOpen, Activity, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIDiaryChat from '@/components/AIDiaryChat';
import TrackersDashboard from '@/components/TrackersDashboard';

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
          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Выход
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto h-14">
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
          </TabsList>

          <TabsContent value="journal" className="space-y-4">
            <AIDiaryChat />
          </TabsContent>

          <TabsContent value="trackers" className="space-y-4">
            <TrackersDashboard />
          </TabsContent>

          <TabsContent value="planner" className="space-y-4">
            <div className="bg-card rounded-2xl p-8 shadow-lg" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h2 className="text-2xl font-semibold mb-4">Планировщик активностей</h2>
              <p className="text-muted-foreground">
                Здесь будет календарь и список запланированных активностей
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
