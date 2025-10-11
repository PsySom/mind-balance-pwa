import type { Activity, ActivityInput, Template } from '@/types/activity';

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
 * Возвращает объект с ошибкой или null если валидация прошла
 */
export function validateActivity(activity: ActivityInput): { title: string; description: string } | null {
  if (!activity.title?.trim()) {
    return {
      title: 'Ошибка валидации',
      description: 'Название обязательно',
    };
  }
  
  if (!activity.date) {
    return {
      title: 'Ошибка валидации',
      description: 'Дата обязательна',
    };
  }
  
  if (activity.duration_min !== undefined && activity.duration_min <= 0) {
    return {
      title: 'Ошибка валидации',
      description: 'Длительность должна быть больше 0',
    };
  }
  
  return null;
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

