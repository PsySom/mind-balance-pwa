import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Lightbulb } from 'lucide-react';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import TemplateList from './TemplateList';

interface Activity {
  id: string;
  title: string;
  category: 'self_care' | 'task' | 'habit' | 'ritual';
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  status: 'planned' | 'completed' | 'cancelled';
}

const SUPABASE_URL = 'https://wzgmfdtqxtuzujipoimc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z21mZHRxeHR1enVqaXBvaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5Nzc5NzIsImV4cCI6MjA3NDU1Mzk3Mn0.6uBF_pdzy8PjSAPOvGwSonmWul8YYHBDwAMHz7Tytb8';

export default function PlannerDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const { toast } = useToast();

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
      fetchActivities();
    }
  }, [userId, userJwt]);

  const fetchActivities = async () => {
    if (!userId || !userJwt) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activities?user_id=eq.${userId}&order=date.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${userJwt}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при загрузке активностей');
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleWebhookRequest = async (action: string, payload: any) => {
    try {
      const response = await fetch('https://mentalbalans.com/webhook/planner-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userJwt,
          user_id: userId,
          action,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при выполнении операции');
      }

      await fetchActivities();
      return true;
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  };

  const handleCreate = async (activity: Omit<Activity, 'id'>, source?: string) => {
    setIsLoading(true);
    try {
      await handleWebhookRequest('create', { 
        activity: { ...activity, source: source || 'manual' }
      });
      toast({
        title: 'Активность создана',
        description: 'Новая активность успешно добавлена',
      });
      setSelectedTemplate(null);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать активность',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, activity: Omit<Activity, 'id'>) => {
    setIsLoading(true);
    try {
      await handleWebhookRequest('update', { update: { id, data: activity } });
      toast({
        title: 'Активность обновлена',
        description: 'Изменения успешно сохранены',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить активность',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await handleWebhookRequest('delete', { delete: { id } });
      toast({
        title: 'Активность удалена',
        description: 'Активность успешно удалена',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить активность',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: Activity['status']) => {
    const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    await handleUpdate(id, { ...activity, status: newStatus });
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate({
      title: template.title.ru,
      category: template.category,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: template.duration_min,
      status: 'planned' as const,
      start_time: '',
      end_time: '',
      note: template.description?.ru || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Планировщик активностей</h2>
        {selectedTemplate ? (
          <ActivityForm
            isLoading={isLoading}
            onSubmit={(data) => handleCreate(data, 'template')}
            activity={selectedTemplate}
            trigger={null}
          />
        ) : (
          <ActivityForm isLoading={isLoading} onSubmit={(data) => handleCreate(data)} />
        )}
      </div>

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="activities" className="gap-2">
            <List className="w-4 h-4" />
            Мои активности
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Рекомендации
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <ActivityList
            activities={activities}
            isLoading={isLoading}
            onToggleComplete={handleToggleComplete}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateList onSelectTemplate={handleSelectTemplate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
