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
import type { Activity, ActivityInput, ActivityFilters, Template } from '@/types/activity';
import { 
  prepareActivityForSubmit, 
  validateActivity, 
  templateToActivity,
  buildFilterParams 
} from '@/lib/activityHelpers';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import TemplateList from './TemplateList';

const WEBHOOK_URL = 'https://mentalbalans.com/webhook/planner-sync';

export default function PlannerDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityInput | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({
    date: '',
    status: 'all',
    category: 'all',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userJwt, filters.date, filters.status, filters.category]);

  const fetchActivities = async () => {
    if (!userId || !userJwt) return;

    console.log('📋 Fetching activities with filters:', filters);
    setIsLoading(true);
    try {
      const filterParams = buildFilterParams(filters);

      console.log('🌐 Webhook request:', {
        action: 'list',
        filters: filterParams,
        user_id: userId
      });

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
        console.error('❌ Response not OK:', response.status, response.statusText);
        throw new Error('Ошибка при загрузке активностей');
      }

      // Проверка на пустой ответ
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ Empty response from webhook');
        setActivities([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Некорректный ответ сервера');
      }

      console.log('✅ Activities loaded:', data);
      setActivities(data.activities || []);
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
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
    console.log(`🚀 Webhook ${action}:`, data);
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
        const errorText = await response.text();
        console.error('❌ Webhook error response:', response.status, errorText);
        throw new Error('Ошибка при выполнении операции');
      }

      // Проверка на пустой ответ
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ Empty response from webhook - fetching activities anyway');
        await fetchActivities();
        return true;
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Некорректный ответ сервера');
      }

      console.log('✅ Webhook success:', result);

      await fetchActivities();
      return true;
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  };

  const handleCreate = async (activity: ActivityInput) => {
    console.log('➕ Creating activity:', activity);
    
    // Валидация
    const validationError = validateActivity(activity);
    if (validationError) {
      console.warn('⚠️ Validation failed:', validationError);
      toast({
        title: validationError.title,
        description: validationError.description,
        variant: 'destructive',
      });
      return;
    }

    // Подготовка данных (форматирование времени)
    const preparedActivity = prepareActivityForSubmit(activity);
    console.log('📝 Prepared activity:', preparedActivity);

    setIsLoading(true);
    try {
      await handleWebhookRequest('create', preparedActivity);
      toast({
        title: 'Активность создана',
        description: 'Новая активность успешно добавлена',
      });
      setSelectedTemplate(null);
    } catch (error) {
      console.error('❌ Create error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать активность',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, activity: ActivityInput) => {
    console.log('✏️ Updating activity:', { id, ...activity });
    
    // Подготовка данных (форматирование времени)
    const preparedActivity = prepareActivityForSubmit(activity);

    setIsLoading(true);
    try {
      await handleWebhookRequest('update', { id, ...preparedActivity });
      toast({
        title: 'Активность обновлена',
        description: 'Изменения успешно сохранены',
      });
    } catch (error) {
      console.error('❌ Update error:', error);
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
    console.log('🗑️ Deleting activity:', id);
    setIsLoading(true);
    try {
      await handleWebhookRequest('delete', { id });
      toast({
        title: 'Активность удалена',
        description: 'Активность успешно удалена',
      });
    } catch (error) {
      console.error('❌ Delete error:', error);
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
    console.log('✅ Toggling completion:', { id, currentStatus });
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
      console.error('❌ Toggle error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    const activityData = templateToActivity(template);
    console.log('📋 Template selected:', activityData);
    setSelectedTemplate(activityData);
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
            Шаблоны
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
