# 🔄 Настройка Realtime для AI Diary

## ⚠️ ВАЖНО!

Realtime необходимо включить вручную через Supabase Dashboard, так как SQL команда `ALTER PUBLICATION` может не работать из-за ограничений прав.

---

## 📋 Шаги для включения Realtime

### Вариант 1: Через UI (Рекомендуется)

1. **Открой Supabase Dashboard**
   - Перейди на https://supabase.com/dashboard
   - Выбери свой проект

2. **Открой Database → Replication**
   - В левом меню: `Database` → `Replication`
   - Найди раздел **"Replication"** или **"Publications"**

3. **Включи Realtime для таблиц**
   - Найди таблицу `ai_diary_messages`
   - Включи переключатель **"Enable Realtime"** или добавь в publication
   - Повтори для `ai_diary_sessions`

4. **Проверь статус**
   - Убедись что обе таблицы отмечены как **"Replicated"**
   - Статус должен быть **"Active"**

---

### Вариант 2: Через SQL (Альтернатива)

Если UI не работает, попробуй через SQL Editor:

```sql
-- Добавить таблицы в Realtime publication
ALTER PUBLICATION supabase_realtime 
ADD TABLE public.ai_diary_messages;

ALTER PUBLICATION supabase_realtime 
ADD TABLE public.ai_diary_sessions;
```

**Если получаешь ошибку прав доступа**, значит нужно использовать Вариант 1 (UI).

---

## ✅ Проверка что Realtime работает

Выполни этот запрос в SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  '✅ Realtime enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('ai_diary_messages', 'ai_diary_sessions')
ORDER BY tablename;
```

**Ожидаемый результат:**

```
schemaname | tablename            | status
-----------|----------------------|-------------------
public     | ai_diary_messages    | ✅ Realtime enabled
public     | ai_diary_sessions    | ✅ Realtime enabled
```

Если видишь обе строки - всё работает! ✅

Если не видишь - вернись к Варианту 1 и включи вручную.

---

## 🧪 Тест Realtime подключения

### В браузере (Console)

Открой консоль браузера (F12) и выполни:

```javascript
// Подключение к Realtime
const { createClient } = supabase;
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_ANON_KEY';
const client = createClient(supabaseUrl, supabaseKey);

// Подписка на изменения
const channel = client
  .channel('test-ai-diary')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ai_diary_messages'
    },
    (payload) => {
      console.log('✅ Realtime работает!', payload);
    }
  )
  .subscribe((status) => {
    console.log('Realtime status:', status);
  });
```

### Вставь тестовое сообщение

В другой вкладке SQL Editor:

```sql
-- Вставь тестовое сообщение
INSERT INTO public.ai_diary_messages (
  user_id, 
  session_id, 
  message_type, 
  message
) VALUES (
  auth.uid(),
  'test_session_123',
  'user',
  'Тестовое сообщение для Realtime'
);
```

Если в консоли появилось `✅ Realtime работает!` - всё ОК!

---

## 🔧 Troubleshooting

### Проблема: Realtime не подключается

**Решение:**
1. Проверь что RLS policies разрешают SELECT для таблицы
2. Убедись что JWT токен валидный
3. Проверь что user_id совпадает с auth.uid()
4. Проверь в Network tab (F12) что WebSocket подключение установлено

### Проблема: События не приходят

**Решение:**
1. Убедись что Realtime включен в UI (Вариант 1)
2. Проверь фильтр в подписке: `filter: 'session_id=eq.YOUR_SESSION'`
3. Проверь что INSERT выполняется от имени правильного пользователя
4. Проверь логи в браузере

### Проблема: "Permission denied for publication"

**Решение:**
- Используй UI (Вариант 1) вместо SQL
- У anon ключа может не быть прав на ALTER PUBLICATION
- Это нормально - UI обходит эту проблему

---

## 📊 Мониторинг Realtime

### Проверка активных подключений

```sql
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE application_name LIKE '%realtime%'
ORDER BY query_start DESC;
```

### Проверка публикаций

```sql
SELECT 
  p.pubname,
  array_agg(pt.tablename) as tables
FROM pg_publication p
LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE p.pubname = 'supabase_realtime'
GROUP BY p.pubname;
```

---

## 🎯 Итог

После выполнения всех шагов у тебя должно быть:

- ✅ Realtime включен для `ai_diary_messages`
- ✅ Realtime включен для `ai_diary_sessions`
- ✅ WebSocket подключение работает
- ✅ События INSERT приходят в реальном времени

Если всё работает - возвращайся к тестированию приложения! 🚀
