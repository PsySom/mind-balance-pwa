-- ============================================
-- 🗄️ AI DIARY - SUPABASE DATABASE SETUP
-- ============================================
-- Инструкция: Скопируй и выполни этот SQL в Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Вставь код → Run
-- ============================================

-- 1️⃣ CREATE ai_diary_sessions TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_diary_sessions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  created_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  message_count integer DEFAULT 0,
  session_duration_minutes integer DEFAULT 0,
  emotions_summary jsonb DEFAULT '{}'::jsonb,
  themes text[] DEFAULT ARRAY[]::text[],
  avg_mood_score numeric(3,1)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ai_diary_sessions_user_status 
ON public.ai_diary_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_diary_sessions_created_at 
ON public.ai_diary_sessions(created_at DESC);

COMMENT ON TABLE public.ai_diary_sessions IS 'AI Diary user sessions tracking';

-- 2️⃣ CREATE ai_diary_messages TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_diary_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text REFERENCES public.ai_diary_sessions(id) ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  message text,
  ai_response text,
  suggestions jsonb DEFAULT '[]'::jsonb,
  emotions jsonb,
  analysis jsonb,
  locale text DEFAULT 'ru',
  token_count integer,
  processing_time_ms integer
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_ai_diary_messages_session 
ON public.ai_diary_messages(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_diary_messages_user 
ON public.ai_diary_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_diary_messages_type 
ON public.ai_diary_messages(message_type);

COMMENT ON TABLE public.ai_diary_messages IS 'AI Diary conversation messages';

-- 3️⃣ ADD MISSING COLUMNS (если таблицы уже существовали)
-- ============================================
DO $$ 
BEGIN
  -- Для ai_diary_messages
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ai_diary_messages') THEN
    ALTER TABLE public.ai_diary_messages 
    ADD COLUMN IF NOT EXISTS suggestions jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS emotions jsonb,
    ADD COLUMN IF NOT EXISTS analysis jsonb,
    ADD COLUMN IF NOT EXISTS locale text DEFAULT 'ru',
    ADD COLUMN IF NOT EXISTS token_count integer,
    ADD COLUMN IF NOT EXISTS processing_time_ms integer;
  END IF;

  -- Для ai_diary_sessions
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ai_diary_sessions') THEN
    ALTER TABLE public.ai_diary_sessions
    ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS session_duration_minutes integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS emotions_summary jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS themes text[] DEFAULT ARRAY[]::text[],
    ADD COLUMN IF NOT EXISTS avg_mood_score numeric(3,1);
  END IF;
END $$;

-- 4️⃣ ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.ai_diary_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diary_messages ENABLE ROW LEVEL SECURITY;

-- 5️⃣ DROP EXISTING POLICIES (чтобы избежать конфликтов)
-- ============================================
DROP POLICY IF EXISTS "Users can view own sessions" ON public.ai_diary_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.ai_diary_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.ai_diary_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.ai_diary_sessions;

DROP POLICY IF EXISTS "Users can view own messages" ON public.ai_diary_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.ai_diary_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.ai_diary_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.ai_diary_messages;

-- 6️⃣ CREATE RLS POLICIES FOR ai_diary_sessions
-- ============================================

-- SELECT: Пользователи видят только свои сессии
CREATE POLICY "Users can view own sessions"
ON public.ai_diary_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Пользователи создают только свои сессии
CREATE POLICY "Users can create own sessions"
ON public.ai_diary_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Пользователи обновляют только свои сессии
CREATE POLICY "Users can update own sessions"
ON public.ai_diary_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Пользователи удаляют только свои сессии
CREATE POLICY "Users can delete own sessions"
ON public.ai_diary_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7️⃣ CREATE RLS POLICIES FOR ai_diary_messages
-- ============================================

-- SELECT: Пользователи видят только свои сообщения
CREATE POLICY "Users can view own messages"
ON public.ai_diary_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Пользователи создают только свои сообщения
CREATE POLICY "Users can insert own messages"
ON public.ai_diary_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Пользователи обновляют только свои сообщения
CREATE POLICY "Users can update own messages"
ON public.ai_diary_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Пользователи удаляют только свои сообщения
CREATE POLICY "Users can delete own messages"
ON public.ai_diary_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 8️⃣ ENABLE REALTIME FOR ai_diary_messages
-- ============================================
-- ⚠️ ВАЖНО: Выполни это в отдельной вкладке SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_diary_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_diary_sessions;

-- 9️⃣ CREATE VIEW FOR USER STATISTICS
-- ============================================
CREATE OR REPLACE VIEW public.v_user_diary_stats AS
SELECT 
  s.user_id,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_sessions,
  COALESCE(AVG(s.message_count), 0) as avg_messages_per_session,
  COALESCE(SUM(s.message_count), 0) as total_messages,
  COALESCE(AVG(s.session_duration_minutes), 0) as avg_session_duration,
  MAX(s.last_activity_at) as last_activity,
  jsonb_object_agg(
    emotion_key, 
    emotion_value
  ) FILTER (WHERE emotion_key IS NOT NULL) as top_emotions
FROM public.ai_diary_sessions s
LEFT JOIN LATERAL (
  SELECT 
    key as emotion_key, 
    value::integer as emotion_value
  FROM jsonb_each_text(s.emotions_summary)
  ORDER BY value::integer DESC
  LIMIT 3
) emotions ON true
GROUP BY s.user_id;

-- Доступ к view
GRANT SELECT ON public.v_user_diary_stats TO authenticated;

-- 🔟 CREATE FUNCTION TO UPDATE SESSION STATS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_session_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Обновляем статистику сессии при добавлении нового сообщения
  UPDATE public.ai_diary_sessions
  SET 
    message_count = message_count + 1,
    last_activity_at = now(),
    session_duration_minutes = EXTRACT(EPOCH FROM (now() - created_at)) / 60
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер
DROP TRIGGER IF EXISTS trigger_update_session_stats ON public.ai_diary_messages;
CREATE TRIGGER trigger_update_session_stats
AFTER INSERT ON public.ai_diary_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_session_stats();

-- ============================================
-- ✅ ПРОВЕРОЧНЫЕ ЗАПРОСЫ
-- ============================================
-- Выполни эти запросы чтобы проверить что всё работает:

-- 1. Проверка существования таблиц
SELECT 
  '✅ Table exists: ' || tablename as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('ai_diary_messages', 'ai_diary_sessions')
ORDER BY tablename;

-- 2. Проверка колонок
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('ai_diary_messages', 'ai_diary_sessions')
ORDER BY table_name, ordinal_position;

-- 3. Проверка RLS
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('ai_diary_messages', 'ai_diary_sessions');

-- 4. Проверка RLS Policies
SELECT 
  schemaname,
  tablename, 
  policyname, 
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'READ'
    WHEN cmd = 'INSERT' THEN 'CREATE'
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
  END as action
FROM pg_policies
WHERE tablename IN ('ai_diary_messages', 'ai_diary_sessions')
ORDER BY tablename, cmd;

-- 5. Проверка Realtime
SELECT 
  '✅ Realtime enabled for: ' || tablename as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('ai_diary_messages', 'ai_diary_sessions');

-- 6. Проверка индексов
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('ai_diary_messages', 'ai_diary_sessions')
ORDER BY tablename, indexname;

-- 7. Финальная проверка
DO $$ 
DECLARE
  tables_ok BOOLEAN;
  rls_ok BOOLEAN;
  policies_ok BOOLEAN;
  realtime_ok BOOLEAN;
BEGIN
  -- Проверка таблиц
  SELECT COUNT(*) = 2 INTO tables_ok
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('ai_diary_messages', 'ai_diary_sessions');
  
  -- Проверка RLS
  SELECT COUNT(*) = 2 INTO rls_ok
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND tablename IN ('ai_diary_messages', 'ai_diary_sessions')
    AND rowsecurity = true;
  
  -- Проверка Policies
  SELECT COUNT(*) >= 8 INTO policies_ok
  FROM pg_policies
  WHERE tablename IN ('ai_diary_messages', 'ai_diary_sessions');
  
  -- Проверка Realtime
  SELECT COUNT(*) >= 1 INTO realtime_ok
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND tablename IN ('ai_diary_messages', 'ai_diary_sessions');
  
  -- Результаты
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 AI DIARY DATABASE SETUP VERIFICATION';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF tables_ok THEN
    RAISE NOTICE '✅ Tables created successfully';
  ELSE
    RAISE NOTICE '❌ Tables missing or incomplete';
  END IF;
  
  IF rls_ok THEN
    RAISE NOTICE '✅ RLS enabled on all tables';
  ELSE
    RAISE NOTICE '❌ RLS not properly enabled';
  END IF;
  
  IF policies_ok THEN
    RAISE NOTICE '✅ RLS Policies created (% policies)', (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('ai_diary_messages', 'ai_diary_sessions'));
  ELSE
    RAISE NOTICE '⚠️  Some RLS Policies may be missing';
  END IF;
  
  IF realtime_ok THEN
    RAISE NOTICE '✅ Realtime enabled for tables';
  ELSE
    RAISE NOTICE '⚠️  Realtime may not be enabled (run ALTER PUBLICATION manually)';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF tables_ok AND rls_ok AND policies_ok THEN
    RAISE NOTICE '🎉 Setup completed successfully!';
  ELSE
    RAISE NOTICE '⚠️  Please review the setup';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================
-- 📋 ДОПОЛНИТЕЛЬНО: Полезные команды
-- ============================================

-- Удалить все данные (для тестирования):
-- TRUNCATE TABLE public.ai_diary_messages CASCADE;
-- TRUNCATE TABLE public.ai_diary_sessions CASCADE;

-- Посмотреть активные сессии пользователя:
-- SELECT * FROM public.ai_diary_sessions 
-- WHERE user_id = auth.uid() AND status = 'active';

-- Посмотреть историю сообщений сессии:
-- SELECT * FROM public.ai_diary_messages 
-- WHERE session_id = 'YOUR_SESSION_ID' 
-- ORDER BY created_at DESC;

-- Посмотреть статистику пользователя:
-- SELECT * FROM public.v_user_diary_stats 
-- WHERE user_id = auth.uid();

-- ============================================
-- ✅ SETUP COMPLETE!
-- ============================================
