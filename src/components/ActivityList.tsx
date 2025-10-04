import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import ActivityForm from './ActivityForm';

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

interface ActivityListProps {
  activities: Activity[];
  isLoading: boolean;
  onToggleComplete: (id: string, currentStatus: Activity['status']) => Promise<void>;
  onUpdate: (id: string, activity: Omit<Activity, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const categoryConfig = {
  self_care: { label: 'Забота о себе', color: 'bg-green-500' },
  task: { label: 'Задача', color: 'bg-blue-500' },
  habit: { label: 'Привычка', color: 'bg-purple-500' },
  ritual: { label: 'Ритуал', color: 'bg-orange-500' },
};

const statusConfig = {
  planned: { label: 'Запланировано', color: 'bg-yellow-500' },
  completed: { label: 'Выполнено', color: 'bg-green-500' },
  cancelled: { label: 'Отменено', color: 'bg-red-500' },
};

export default function ActivityList({
  activities,
  isLoading,
  onToggleComplete,
  onUpdate,
  onDelete,
}: ActivityListProps) {
  // Группировка по дням
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (activities.length === 0 && !isLoading) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Нет запланированных активностей</p>
        <p className="text-sm text-muted-foreground mt-1">
          Добавьте активность, чтобы начать планирование
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: ru })}
          </h3>
          <div className="space-y-2">
            {groupedActivities[date].map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={activity.status === 'completed'}
                    onCheckedChange={() => onToggleComplete(activity.id, activity.status)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4
                          className={`font-medium ${
                            activity.status === 'completed' ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {activity.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            <div className={`w-2 h-2 rounded-full ${categoryConfig[activity.category].color} mr-1`} />
                            {categoryConfig[activity.category].label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {statusConfig[activity.status].label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <ActivityForm
                          activity={activity}
                          isLoading={isLoading}
                          onSubmit={(data) => onUpdate(activity.id, data)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDelete(activity.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {activity.start_time && activity.end_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.start_time} - {activity.end_time}
                        </span>
                      )}
                      <span>{activity.duration_minutes} мин</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
