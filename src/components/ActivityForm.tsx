import { useState } from 'react';
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

interface Activity {
  id?: string;
  title: string;
  category: 'self_care' | 'task' | 'habit' | 'ritual';
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  status: 'planned' | 'completed' | 'cancelled';
}

interface ActivityFormProps {
  activity?: Activity;
  isLoading: boolean;
  onSubmit: (activity: Omit<Activity, 'id'>) => Promise<void>;
  trigger?: React.ReactNode;
}

const categoryLabels = {
  self_care: 'Забота о себе',
  task: 'Задача',
  habit: 'Привычка',
  ritual: 'Ритуал',
};

export default function ActivityForm({ activity, isLoading, onSubmit, trigger }: ActivityFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Activity, 'id'>>({
    title: activity?.title || '',
    category: activity?.category || 'task',
    date: activity?.date || format(new Date(), 'yyyy-MM-dd'),
    start_time: activity?.start_time || '',
    end_time: activity?.end_time || '',
    duration_minutes: activity?.duration_minutes || 30,
    status: activity?.status || 'planned',
  });
  const [selectedDate, setSelectedDate] = useState<Date>(
    activity?.date ? new Date(activity.date) : new Date()
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setOpen(false);
    // Сброс формы только если это создание новой активности
    if (!activity) {
      setFormData({
        title: '',
        category: 'task',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '',
        end_time: '',
        duration_minutes: 30,
        status: 'planned',
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
                {Object.entries(categoryLabels).map(([value, label]) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Время начала</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Время конца</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Длительность (минуты)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))
              }
              required
            />
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
