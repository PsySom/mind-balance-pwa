import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Activity, ActivityInput } from '@/types/activity';
import { CATEGORY_LABELS, SLOT_LABELS } from '@/types/activity';
import { formatTimeForInput } from '@/lib/activityHelpers';

interface ActivityFormProps {
  activity?: Activity | ActivityInput;
  isLoading: boolean;
  onSubmit: (activity: ActivityInput) => Promise<void>;
  trigger?: React.ReactNode | null;
}

export default function ActivityForm({ activity, isLoading, onSubmit, trigger }: ActivityFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ActivityInput>({
    title: '',
    description: '',
    category: 'task',
    date: format(new Date(), 'yyyy-MM-dd'),
    time_start: '',
    time_end: '',
    duration_min: 30,
    slot_hint: 'any',
    priority: 3,
    status: 'planned',
    completion_note: '',
    source: 'user',
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Обновление формы при изменении activity (для редактирования)
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        category: activity.category || 'task',
        date: activity.date || format(new Date(), 'yyyy-MM-dd'),
        time_start: formatTimeForInput(activity.time_start),
        time_end: formatTimeForInput(activity.time_end),
        duration_min: activity.duration_min || 30,
        slot_hint: activity.slot_hint || 'any',
        priority: activity.priority || 3,
        status: activity.status || 'planned',
        completion_note: activity.completion_note || '',
        source: activity.source || 'user',
      });
      setSelectedDate(activity.date ? new Date(activity.date) : new Date());
    }
  }, [activity]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title?.trim()) {
      return; // HTML required сработает
    }
    if (!formData.date) {
      return; // HTML required сработает
    }
    if (formData.duration_min && formData.duration_min <= 0) {
      return; // HTML min сработает
    }

    await onSubmit(formData);
    setOpen(false);
    
    // Сброс формы только если это создание новой активности
    if (!activity) {
      setFormData({
        title: '',
        description: '',
        category: 'task',
        date: format(new Date(), 'yyyy-MM-dd'),
        time_start: '',
        time_end: '',
        duration_min: 30,
        slot_hint: 'any',
        priority: 3,
        status: 'planned',
        completion_note: '',
        source: 'user',
      });
      setSelectedDate(new Date());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Добавить активность
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{activity ? 'Редактировать' : 'Добавить'} активность</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Например: Утренняя медитация"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select
              value={formData.category}
              onValueChange={(value: Activity['category']) =>
                setFormData(prev => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Дата</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: ru }) : 'Выберите дату'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Дополнительная информация"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_start">Время начала</Label>
              <Input
                id="time_start"
                type="time"
                value={formData.time_start}
                onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_end">Время конца</Label>
              <Input
                id="time_end"
                type="time"
                value={formData.time_end}
                onChange={(e) => setFormData(prev => ({ ...prev, time_end: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Длительность (мин)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_min}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, duration_min: parseInt(e.target.value) || 0 }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет (1-5)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="5"
                value={formData.priority}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 3 }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot_hint">Время дня</Label>
            <Select
              value={formData.slot_hint}
              onValueChange={(value: Activity['slot_hint']) =>
                setFormData(prev => ({ ...prev, slot_hint: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SLOT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Activity['status']) =>
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Запланировано</SelectItem>
                <SelectItem value="completed">Выполнено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Сохранение...
              </>
            ) : activity ? (
              'Обновить'
            ) : (
              'Создать'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
