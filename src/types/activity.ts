export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: 'self_care' | 'task' | 'habit' | 'ritual' | 'routine';
  date: string; // YYYY-MM-DD
  time_start?: string; // HH:MM:SS
  time_end?: string; // HH:MM:SS
  duration_min?: number;
  slot_hint?: 'morning' | 'afternoon' | 'evening' | 'any';
  priority?: number; // 1-5
  status: 'planned' | 'completed' | 'cancelled';
  completion_note?: string;
  source: 'user' | 'template';
}

export type ActivityInput = Omit<Activity, 'id'>;

export interface ActivityFilters {
  date: string;
  status: 'all' | Activity['status'];
  category: 'all' | Activity['category'];
}

export interface Template {
  id: string;
  title: { ru: string };
  description: { ru: string };
  category: Activity['category'];
  duration_min: number;
  difficulty_level: number;
  is_active: boolean;
}

export const CATEGORY_LABELS = {
  self_care: 'Забота о себе',
  task: 'Задача',
  habit: 'Привычка',
  ritual: 'Ритуал',
  routine: 'Рутина',
} as const;

export const STATUS_LABELS = {
  planned: 'Запланировано',
  completed: 'Выполнено',
  cancelled: 'Отменено',
} as const;

export const SLOT_LABELS = {
  morning: 'Утро',
  afternoon: 'День',
  evening: 'Вечер',
  any: 'Любое время',
} as const;
