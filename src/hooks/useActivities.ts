import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Activity, ActivityInput, ActivityFilters } from '@/types/activity';
import { prepareActivityForSubmit, validateActivity } from '@/lib/activityHelpers';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [filters, setFilters] = useState<ActivityFilters>({
    date: '',
    status: 'all',
    category: 'all',
  });
  const { toast } = useToast();

  // Получение текущего пользователя
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    getSession();
  }, []);

  // Загрузка активностей при изменении фильтров
  useEffect(() => {
    if (userId) {
      fetchActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filters.date, filters.status, filters.category]);

  // Загрузка активностей из Supabase
  const fetchActivities = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId);

      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('time_start', { ascending: true });

      if (error) throw error;

      setActivities((data as Activity[]) || []);
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

  // Создание новой активности
  const createActivity = async (activity: ActivityInput): Promise<boolean> => {
    if (!userId) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо войти',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Валидация
      validateActivity(activity);

      const preparedActivity = prepareActivityForSubmit(activity);
      setIsLoading(true);

      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...preparedActivity,
          user_id: userId,
        }])
        .select();

      if (error) throw error;

      toast({
        title: 'Активность создана',
        description: 'Активность успешно добавлена',
      });

      await fetchActivities();
      return true;
    } catch (error: any) {
      toast({
        title: 'Ошибка создания',
        description: error.message || 'Не удалось создать активность',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление активности
  const updateActivity = async (id: string, activity: ActivityInput) => {
    const preparedActivity = prepareActivityForSubmit(activity);

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .update(preparedActivity)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Активность обновлена',
        description: 'Изменения успешно сохранены',
      });

      await fetchActivities();
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить активность',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление активности
  const deleteActivity = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Активность удалена',
        description: 'Активность успешно удалена',
      });

      await fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить активность',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Переключение статуса выполнения
  const toggleComplete = async (id: string, currentStatus: Activity['status']) => {
    setIsLoading(true);
    try {
      const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
      const completionNote = newStatus === 'completed' ? 'Выполнено' : '';

      const { error } = await supabase
        .from('activities')
        .update({
          status: newStatus,
          completion_note: completionNote,
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: newStatus === 'completed' ? 'Выполнено' : 'Отменена отметка',
        description: newStatus === 'completed' 
          ? 'Активность отмечена как выполненная' 
          : 'Статус изменен на запланирован',
      });

      await fetchActivities();
    } catch (error) {
      console.error('Error toggling activity:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activities,
    isLoading,
    filters,
    setFilters,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleComplete,
    refetch: fetchActivities,
  };
}
