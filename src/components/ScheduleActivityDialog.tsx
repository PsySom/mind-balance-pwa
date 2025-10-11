import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/activity';

interface ScheduleActivityDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (template: Template, date: string, timeStart?: string, timeEnd?: string) => void;
}

export default function ScheduleActivityDialog({
  template,
  open,
  onOpenChange,
  onSchedule,
}: ScheduleActivityDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeStart, setTimeStart] = useState<string>('');
  const [timeEnd, setTimeEnd] = useState<string>('');

  const handleSchedule = () => {
    if (!template) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    onSchedule(template, dateStr, timeStart || undefined, timeEnd || undefined);
    
    // Reset
    setSelectedDate(new Date());
    setTimeStart('');
    setTimeEnd('');
    onOpenChange(false);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Запланировать: {template.title.ru}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Дата</Label>
            <div className="border rounded-lg p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={ru}
                className="pointer-events-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-start">Время начала</Label>
              <Input
                id="time-start"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                placeholder="09:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-end">Время окончания</Label>
              <Input
                id="time-end"
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                placeholder="10:00"
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              {format(selectedDate, 'PPP', { locale: ru })}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSchedule}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
