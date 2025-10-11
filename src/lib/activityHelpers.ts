import type { Activity, ActivityInput, Template, ActivityCategory } from '@/types/activity';

export const VALID_CATEGORIES: ActivityCategory[] = [
  'self_care',
  'task',
  'habit',
  'ritual',
  'routine'
] as const;

/**
 * Возвращает локализованную метку для категории
 */
export function getCategoryLabel(category: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    'self_care': 'Забота о себе',
    'task': 'Задача',
    'habit': 'Привычка',
    'ritual': 'Ритуал',
    'routine': 'Рутина'
  };
  return labels[category] || category;
}

/**
 * Форматирует время из HH:MM в HH:MM:SS
 * Если время уже в формате HH:MM:SS, возвращает его без изменений
 */
export function formatTimeToSQL(time: string | undefined): string | undefined {
  if (!time) return undefined;
  
  // Если уже в формате HH:MM:SS, вернуть как есть
  if (time.length === 8 && time.split(':').length === 3) {
    return time;
  }
  
  // Если в формате HH:MM, добавить :00
  if (time.length === 5 && time.split(':').length === 2) {
    return `${time}:00`;
  }
  
  return time;
}

/**
 * Форматирует время из HH:MM:SS в HH:MM для input[type="time"]
 */
export function formatTimeForInput(time: string | undefined): string {
  if (!time) return '';
  
  // Вернуть только HH:MM (первые 5 символов)
  return time.slice(0, 5);
}

/**
 * Подготавливает активность для отправки на сервер
 * Форматирует время в HH:MM:SS
 */
export function prepareActivityForSubmit(activity: ActivityInput): ActivityInput {
  return {
    ...activity,
    time_start: formatTimeToSQL(activity.time_start),
    time_end: formatTimeToSQL(activity.time_end),
  };
}

/**
 * Валидирует данные активности
 * Выбрасывает ошибку если валидация не прошла
 */
export function validateActivity(activity: ActivityInput): void {
  if (!activity.title?.trim()) {
    throw new Error('Название обязательно');
  }
  
  if (!activity.date) {
    throw new Error('Дата обязательна');
  }
  
  if (activity.category && !VALID_CATEGORIES.includes(activity.category)) {
    throw new Error(`Недопустимая категория: ${activity.category}`);
  }
  
  if (activity.duration_min !== undefined && activity.duration_min <= 0) {
    throw new Error('Длительность должна быть больше 0');
  }
}

/**
 * Конвертирует шаблон в начальные данные для формы активности
 */
export function templateToActivity(template: Template): ActivityInput {
  return {
    title: template.title.ru,
    description: template.description?.ru || '',
    category: template.category,
    date: new Date().toISOString().split('T')[0],
    duration_min: template.duration_min,
    slot_hint: 'any',
    priority: 3,
    status: 'planned',
    source: 'template',
  };
}

