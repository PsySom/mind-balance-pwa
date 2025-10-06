import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit2, Trash2, Calendar, Clock, Star, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Activity, ActivityInput } from '@/types/activity';
import ActivityForm from './ActivityForm';

interface ActivityListProps {
  activities: Activity[];
  isLoading: boolean;
  onToggleComplete: (id: string, currentStatus: Activity['status']) => Promise<void>;
  onUpdate: (id: string, activity: ActivityInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const categoryConfig = {
  self_care: { label: 'Забота о себе', color: 'bg-green-500' },
  task: { label: 'Задача', color: 'bg-blue-500' },
  habit: { label: 'Привычка', color: 'bg-purple-500' },
  ritual: { label: 'Ритуал', color: 'bg-orange-500' },
  routine: { label: 'Рутина', color: 'bg-pink-500' },
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

  const renderStars = (priority: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < priority ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-64" />
            <Card className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
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
      {sortedDates.map((date) => {
        const dayActivities = groupedActivities[date];
        const completedCount = dayActivities.filter(a => a.status === 'completed').length;
        const totalCount = dayActivities.length;

        return (
          <div key={date} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: ru })}
              </h3>
              <span className="text-sm text-muted-foreground">
                {completedCount} из {totalCount} выполнено
              </span>
            </div>
            <div className="space-y-2">
              {dayActivities.map((activity) => (
                <Card key={activity.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={activity.status === 'completed'}
                      onCheckedChange={() => onToggleComplete(activity.id, activity.status)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              activity.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {activity.title}
                          </h4>
                          
                          {/* Description */}
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          )}

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <div className={`w-2 h-2 rounded-full ${categoryConfig[activity.category].color} mr-1`} />
                              {categoryConfig[activity.category].label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {statusConfig[activity.status].label}
                            </Badge>
                          </div>
                        </div>

                        {/* Action Buttons */}
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
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить активность?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Активность "{activity.title}" будет удалена навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(activity.id)}>
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Time, Duration, Priority */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {activity.time_start && activity.time_end && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.time_start.slice(0, 5)} - {activity.time_end.slice(0, 5)}
                          </span>
                        )}
                        {activity.duration_min && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.duration_min} мин
                          </span>
                        )}
                        {activity.priority && activity.priority > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(activity.priority)}
                          </div>
                        )}
                      </div>

                      {/* Completion Note */}
                      {activity.status === 'completed' && activity.completion_note && (
                        <div className="flex gap-2 p-2 bg-muted/50 rounded text-xs">
                          <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{activity.completion_note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
