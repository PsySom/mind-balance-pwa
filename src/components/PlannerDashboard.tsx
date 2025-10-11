import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { List, Lightbulb, CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ActivityInput, Template } from '@/types/activity';
import { templateToActivity } from '@/lib/activityHelpers';
import { useActivities } from '@/hooks/useActivities';
import ActivityList from './ActivityList';
import TemplateList from './TemplateList';
import ScheduleActivityDialog from './ScheduleActivityDialog';
import PlayTemplateDialog from './PlayTemplateDialog';

export default function PlannerDashboard() {
  const [playTemplate, setPlayTemplate] = useState<Template | null>(null);
  const [scheduleTemplate, setScheduleTemplate] = useState<Template | null>(null);
  const {
    activities,
    isLoading,
    filters,
    setFilters,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleComplete,
  } = useActivities();

  const handlePlay = (template: Template) => {
    setPlayTemplate(template);
  };

  const handleScheduleClick = (template: Template) => {
    setScheduleTemplate(template);
  };

  const handleSchedule = async (template: Template, date: string, timeStart?: string, timeEnd?: string) => {
    const activityData = templateToActivity(template);
    const activity: ActivityInput = {
      ...activityData,
      date,
      time_start: timeStart,
      time_end: timeEnd,
    };
    await createActivity(activity);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Планировщик активностей</h2>
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
            onToggleComplete={toggleComplete}
            onUpdate={updateActivity}
            onDelete={deleteActivity}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateList onPlay={handlePlay} onSchedule={handleScheduleClick} />
        </TabsContent>
      </Tabs>

      <ScheduleActivityDialog
        template={scheduleTemplate}
        open={!!scheduleTemplate}
        onOpenChange={(open) => !open && setScheduleTemplate(null)}
        onSchedule={handleSchedule}
      />

      <PlayTemplateDialog
        template={playTemplate}
        open={!!playTemplate}
        onOpenChange={(open) => !open && setPlayTemplate(null)}
      />
    </div>
  );
}
