import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { List, Lightbulb, CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import TemplateList from './TemplateList';

interface Activity {
  id: string;
  title: string;
  description?: string;
  category: 'self_care' | 'task' | 'habit' | 'ritual' | 'routine';
  date: string;
  time_start?: string;
  time_end?: string;
  duration_min?: number;
  slot_hint?: 'morning' | 'afternoon' | 'evening' | 'any';
  priority?: number;
  status: 'planned' | 'completed' | 'cancelled';
  completion_note?: string;
  source: 'user' | 'template';
}

const WEBHOOK_URL = 'https://mentalbalans.com/webhook/planner-sync';

export default function PlannerDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [filters, setFilters] = useState({
    date: '',
    status: 'all' as 'all' | 'planned' | 'completed' | 'cancelled',
    category: 'all' as 'all' | Activity['category'],
  });
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
  }, [userId, userJwt, filters]);

  const fetchActivities = async () => {
    if (!userId || !userJwt) return;

    setIsLoading(true);
    try {
      const filterParams: any = {
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        limit: 100,
      };

      if (filters.date) {
        filterParams.date = filters.date;
      }
      if (filters.status !== 'all') {
        filterParams.status = filters.status;
      }
      if (filters.category !== 'all') {
        filterParams.category = filters.category;
      }

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userJwt,
          user_id: userId,
          action: 'list',
          filters: filterParams,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке активностей');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить активности',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebhookRequest = async (action: string, data?: any) => {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userJwt,
          user_id: userId,
          action,
          data,
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

  const handleCreate = async (activity: Omit<Activity, 'id'>) => {
    // Валидация
    if (!activity.title?.trim()) {
      toast({
        title: 'Ошибка валидации',
        description: 'Название обязательно',
        variant: 'destructive',
      });
      return;
    }
    if (!activity.date) {
      toast({
        title: 'Ошибка валидации',
        description: 'Дата обязательна',
        variant: 'destructive',
      });
      return;
    }
    if (activity.duration_min && activity.duration_min <= 0) {
      toast({
        title: 'Ошибка валидации',
        description: 'Длительность должна быть больше 0',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await handleWebhookRequest('create', activity);
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
      await handleWebhookRequest('update', { id, ...activity });
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
      await handleWebhookRequest('delete', { id });
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
    setIsLoading(true);
    try {
      const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
      const completionNote = newStatus === 'completed' ? 'Выполнено' : '';
      
      await handleWebhookRequest('complete', { 
        id, 
        status: newStatus,
        completion_note: completionNote 
      });
      
      toast({
        title: newStatus === 'completed' ? 'Выполнено' : 'Отменена отметка',
        description: newStatus === 'completed' ? 'Активность отмечена как выполненная' : 'Статус изменен на запланирован',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate({
      title: template.title.ru,
      description: template.description?.ru || '',
      category: template.category,
      date: new Date().toISOString().split('T')[0],
      duration_min: template.duration_min,
      slot_hint: 'any' as const,
      priority: 3,
      status: 'planned' as const,
      source: 'template' as const,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Планировщик активностей</h2>
        {selectedTemplate ? (
          <ActivityForm
            isLoading={isLoading}
            onSubmit={handleCreate}
            activity={selectedTemplate}
            trigger={null}
          />
        ) : (
          <ActivityForm isLoading={isLoading} onSubmit={handleCreate} />
        )}
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Фильтры:</span>
        </div>

        {/* Фильтр по дате */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'justify-start text-left font-normal',
                !filters.date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              {filters.date ? format(new Date(filters.date), 'PPP', { locale: ru }) : 'Дата'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.date ? new Date(filters.date) : undefined}
              onSelect={(date) => setFilters(prev => ({ ...prev, date: date ? format(date, 'yyyy-MM-dd') : '' }))}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Фильтр по статусу */}
        <Select
          value={filters.status}
          onValueChange={(value: typeof filters.status) =>
            setFilters(prev => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="planned">Запланировано</SelectItem>
            <SelectItem value="completed">Выполнено</SelectItem>
            <SelectItem value="cancelled">Отменено</SelectItem>
          </SelectContent>
        </Select>

        {/* Фильтр по категории */}
        <Select
          value={filters.category}
          onValueChange={(value: typeof filters.category) =>
            setFilters(prev => ({ ...prev, category: value }))
          }
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="self_care">Забота о себе</SelectItem>
            <SelectItem value="task">Задача</SelectItem>
            <SelectItem value="habit">Привычка</SelectItem>
            <SelectItem value="ritual">Ритуал</SelectItem>
            <SelectItem value="routine">Рутина</SelectItem>
          </SelectContent>
        </Select>

        {/* Сброс фильтров */}
        {(filters.date || filters.status !== 'all' || filters.category !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ date: '', status: 'all', category: 'all' })}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            Сбросить
          </Button>
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
