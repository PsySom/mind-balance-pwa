# AI Дневник - Техническая Документация

## 📋 Оглавление

1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Структура файлов](#структура-файлов)
4. [Логика работы](#логика-работы)
5. [Сценарии пользователя](#сценарии-пользователя)
6. [API и База данных](#api-и-база-данных)
7. [Настройка и конфигурация](#настройка-и-конфигурация)

---

## 🎯 Обзор системы

AI Дневник - это интерактивная система для ведения дневника с искусственным интеллектом, которая:

- Анализирует эмоциональное состояние пользователя
- Предоставляет персонализированные рекомендации
- Сохраняет историю сессий и сообщений
- Работает в реальном времени через WebSocket (Realtime)
- Поддерживает два режима: Production (реальный API) и Mock (локальное тестирование)

### Ключевые возможности

- ✅ Чат с AI в реальном времени
- ✅ Автоматическое определение эмоций и настроения
- ✅ Управление сессиями (создание, завершение)
- ✅ История всех диалогов
- ✅ Статистика использования
- ✅ Адаптивные предложения (suggestions)
- ✅ Эффект печати для AI ответов
- ✅ Дублирование защиты от повторных сообщений

---

## 🏗 Архитектура

### Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ AIDiaryChat     │  │ FreeChat         │                 │
│  │ (entry point)   │→ │ (main container) │                 │
│  └─────────────────┘  └──────────────────┘                 │
│         │                      │                             │
│         ├──────────────────────┼─────────────┐              │
│         ↓                      ↓             ↓              │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────┐    │
│  │ FreeChatHeader│  │ FreeChatMessages│  │FreeChatInput│   │
│  └──────────────┘  └─────────────────┘  └────────────┘    │
│                            │                                 │
│                            ↓                                 │
│                    ┌──────────────┐                         │
│                    │ ChatMessage   │                         │
│                    │ QuickSuggestions│                       │
│                    └──────────────┘                         │
├─────────────────────────────────────────────────────────────┤
│  Hooks:                                                      │
│  ┌──────────────────┐  ┌─────────────────────┐            │
│  │ useAIDiaryChat   │  │ useAIDiaryAnalytics │            │
│  │ (main logic)     │  │ (statistics)        │            │
│  └──────────────────┘  └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│  ┌─────────────────────────┐  ┌──────────────────────────┐│
│  │ ai-diary.service.ts     │  │ ai-diary-sessions.service││
│  │ (API communication)     │  │ (session management)     ││
│  └─────────────────────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Webhook + Supabase)              │
├─────────────────────────────────────────────────────────────┤
│  Webhook: https://mentalbalans.com/webhook/ai-diary-message │
│  ↓                                                           │
│  ┌──────────────────────┐                                   │
│  │ AI Processing (n8n)  │                                   │
│  │ - Emotion analysis   │                                   │
│  │ - Response generation│                                   │
│  │ - Suggestions        │                                   │
│  └──────────────────────┘                                   │
│           ↓                                                  │
│  ┌────────────────────────────────────────┐                │
│  │ Supabase Database                      │                │
│  │ - ai_diary_sessions                    │                │
│  │ - ai_diary_messages                    │                │
│  │ - Realtime subscriptions               │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Структура файлов

### Основные файлы и их назначение

```
src/
├── components/
│   ├── AIDiaryChat.tsx                      # Точка входа (wrapper)
│   └── dashboard/ai-diary/
│       ├── FreeChat.tsx                     # Главный контейнер чата
│       ├── FreeChatHeader.tsx               # Хедер с кнопками управления
│       ├── FreeChatMessages.tsx             # Список сообщений
│       ├── FreeChatInput.tsx                # Поле ввода
│       ├── ChatMessage.tsx                  # Одно сообщение
│       ├── QuickSuggestions.tsx             # Быстрые предложения
│       └── AIDiaryStats.tsx                 # Статистика сессии
│
├── hooks/
│   ├── useAIDiaryChat.ts                    # Основная логика чата
│   ├── useAIDiaryAnalytics.ts               # Загрузка статистики
│   └── useAuth.ts                           # Аутентификация
│
├── services/
│   ├── ai-diary.service.ts                  # API взаимодействие
│   └── ai-diary-sessions.service.ts         # Управление сессиями
│
└── types/
    └── (ChatMessage, DiarySession)          # TypeScript типы
```

---

## ⚙️ Логика работы

### 1. Инициализация (useAIDiaryChat)

**При монтировании компонента:**

```typescript
useEffect(() => {
  if (!user) return;
  
  // 1. Получаем текущую сессию из localStorage
  const currentSessionId = aiDiaryService.getCurrentSessionId();
  
  if (currentSessionId) {
    // 2a. Если сессия есть → загружаем историю сообщений
    const messages = await aiDiarySessionsService.getSessionMessages(currentSessionId);
    setMessages(convertToDisplay(messages));
    
    // 2b. Подписываемся на Realtime для получения новых сообщений
    subscribeToSession(currentSessionId);
  } else {
    // 3. Если сессии нет → показываем приветственное сообщение
    showWelcomeMessage();
  }
}, [user]);
```

### 2. Отправка сообщения (sendMessage)

**Пошаговый процесс:**

```typescript
async function sendMessage(messageText: string) {
  // ШАГ 1: Проверяем наличие сессии
  if (!sessionId) {
    const newSession = await aiDiarySessionsService.createSession(user.id);
    setSessionId(newSession.session_id);
    // 🔥 ВАЖНО: Сразу подписываемся на Realtime для новой сессии
    subscribeToSession(newSession.session_id);
  }
  
  // ШАГ 2: Добавляем сообщение пользователя в UI
  const userMessage = {
    id: generateId(),
    content: messageText,
    type: 'user',
    timestamp: new Date().toISOString()
  };
  setMessages(prev => [...prev, userMessage]);
  
  // ШАГ 3: Показываем индикатор "AI печатает..."
  setIsLoading(true);
  
  // ШАГ 4: Отправляем запрос к API
  const response = await aiDiaryService.sendMessage(
    userJwt,
    user.id,
    messageText,
    sessionId,
    'ru'
  );
  
  // ШАГ 5: Устанавливаем таймер-фоллбэк
  // - 1.2 секунды для MOCK
  // - 30 секунд для Production
  const timeout = response.data?.is_mock ? 1200 : 30000;
  const fallbackTimer = setTimeout(() => {
    if (!aiResponseReceived) {
      // Если Realtime не ответил → используем fallback
      handleFallbackResponse(response.data);
    }
  }, timeout);
  
  // ШАГ 6: Realtime получает ответ → отменяем таймер
  // (см. handleNewAIMessage)
}
```

### 3. Получение ответа (Realtime + Fallback)

**Два канала доставки:**

#### A. Realtime (основной)

```typescript
function subscribeToSession(sessId: string) {
  const channel = supabase
    .channel(`ai_diary_session_${sessId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'ai_diary_messages',
      filter: `session_id=eq.${sessId}`
    }, (payload) => {
      const newMessage = payload.new;
      
      // Обрабатываем только AI сообщения
      if (newMessage.message_type === 'ai') {
        handleNewAIMessage(newMessage);
      }
    })
    .subscribe();
}
```

#### B. Fallback (резервный)

```typescript
// Если Realtime молчит больше таймаута → используем прямой ответ API
const fallbackTimer = setTimeout(() => {
  if (!aiResponseReceived) {
    const aiMessage = {
      id: response.data.saved_entry_id,
      content: response.data.ai_response,
      type: 'ai',
      suggestions: response.data.suggestions,
      emotions: response.data.emotions,
      analysis: response.data.analysis,
      timestamp: new Date().toISOString()
    };
    
    // Проверяем дубликаты
    if (!messages.some(m => m.id === aiMessage.id)) {
      setMessages(prev => [...prev, aiMessage]);
      typeMessage(aiMessage.id, aiMessage.content);
    }
  }
}, timeout);
```

### 4. Эффект печати (typeMessage)

**Постепенное отображение текста:**

```typescript
function typeMessage(messageId: string, fullText: string) {
  setIsTyping(true);
  
  // Адаптивная скорость:
  // - Короткие тексты (<50 символов) → задержка 500ms
  // - Длинные тексты → 30ms на символ
  const delay = fullText.length < 50 ? 500 : fullText.length * 30;
  
  setTimeout(() => {
    // Обновляем сообщение с полным текстом
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: fullText }
        : msg
    ));
    setIsTyping(false);
  }, delay);
}
```

### 5. Управление сессиями

#### Новая сессия (startNewSession)

```typescript
async function startNewSession() {
  // 1. Отписываемся от старого Realtime
  if (realtimeChannelRef.current) {
    supabase.removeChannel(realtimeChannelRef.current);
  }
  
  // 2. Создаем новую сессию в БД
  const newSession = await aiDiarySessionsService.createSession(user.id);
  
  // 3. Сохраняем session_id
  setSessionId(newSession.session_id);
  aiDiaryService.setCurrentSessionId(newSession.session_id);
  
  // 4. 🔥 СРАЗУ подписываемся на Realtime для новой сессии
  subscribeToSession(newSession.session_id);
  
  // 5. Очищаем сообщения
  setMessages([]);
  
  // 6. Показываем новое приветствие
  showWelcomeMessage();
}
```

#### Завершение сессии (endSession)

```typescript
async function endSession() {
  if (!sessionId) return;
  
  // 1. Обновляем статус в БД
  await aiDiarySessionsService.endSession(sessionId);
  
  // 2. Отписываемся от Realtime
  if (realtimeChannelRef.current) {
    supabase.removeChannel(realtimeChannelRef.current);
  }
  
  // 3. Очищаем localStorage
  aiDiaryService.clearCurrentSessionId();
  
  // 4. Сбрасываем состояние
  setSessionId(null);
  setMessages([]);
  
  // 5. Уведомление
  toast.success('Сессия сохранена в истории');
}
```

---

## 👤 Сценарии пользователя

### Сценарий 1: Первое посещение

```
1. Пользователь открывает страницу AI Дневника
   ↓
2. Система проверяет localStorage → сессии нет
   ↓
3. Показывается приветственное сообщение:
   "Привет! Я твой AI-ассистент для ведения дневника..."
   ↓
4. Отображаются 4 базовых предложения:
   - 😊 Расскажи о своих мыслях
   - 🤔 Хочу разобраться в чувствах
   - 💬 Поговорим о планах
   - 🌟 Что меня вдохновляет
   ↓
5. Пользователь кликает на предложение или вводит текст
   ↓
6. Создается новая сессия → начинается диалог
```

### Сценарий 2: Продолжение диалога

```
1. Пользователь вводит: "Сегодня был стресс на работе"
   ↓
2. Сообщение добавляется в UI мгновенно
   ↓
3. Показывается индикатор "AI печатает..."
   ↓
4. Запрос отправляется на webhook
   ↓
5. Webhook обрабатывает → сохраняет в БД
   ↓
6. Realtime получает INSERT событие
   ↓
7. AI ответ появляется с эффектом печати:
   "Я понимаю, что вы испытываете стресс..."
   ↓
8. Под ответом появляются 4 новых предложения:
   - 🧘 Как справиться со стрессом?
   - 😌 Покажи технику релаксации
   - 📝 Расскажу что беспокоит подробнее
   - 💭 Что я могу сделать прямо сейчас?
```

### Сценарий 3: Новая сессия

```
1. Пользователь кликает "Новая сессия"
   ↓
2. Показывается диалог подтверждения:
   "Начать новую сессию? Текущая будет сохранена"
   ↓
3. Пользователь подтверждает
   ↓
4. Старая сессия закрывается (status = 'ended')
   ↓
5. Создается новая сессия в БД
   ↓
6. Realtime подписка обновляется
   ↓
7. Чат очищается → показывается новое приветствие
   ↓
8. Toast: "Начата новая сессия"
```

### Сценарий 4: Завершение сессии

```
1. Пользователь кликает "Завершить сессию"
   ↓
2. Диалог: "Завершить? История сохранится"
   ↓
3. Подтверждение
   ↓
4. Обновление БД: status = 'ended', ended_at = now()
   ↓
5. Отписка от Realtime
   ↓
6. Очистка localStorage и UI
   ↓
7. Toast: "Сессия сохранена в истории"
```

### Сценарий 5: Fallback (если Realtime не работает)

```
1. Пользователь отправляет сообщение
   ↓
2. Запрос к API → ответ получен
   ↓
3. Ждем Realtime (30 секунд для prod)
   ↓
4. Realtime молчит → таймер срабатывает
   ↓
5. Используем прямой ответ из API
   ↓
6. AI сообщение добавляется в UI
   ↓
7. Эффект печати → suggestions
```

---

## 🗄 API и База данных

### Database Schema

#### Таблица: `ai_diary_sessions`

```sql
CREATE TABLE ai_diary_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'active', -- 'active' | 'ended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  primary_emotion TEXT,
  themes TEXT[],
  average_mood_score DECIMAL(3,1)
);

-- Индекс для быстрого поиска активных сессий
CREATE INDEX idx_active_sessions ON ai_diary_sessions(user_id, status);
```

#### Таблица: `ai_diary_messages`

```sql
CREATE TABLE ai_diary_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID NOT NULL REFERENCES ai_diary_sessions(session_id),
  message_type TEXT NOT NULL, -- 'user' | 'ai' | 'system'
  message TEXT,
  ai_response TEXT,
  suggestions TEXT[],
  emotions JSONB,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для Realtime подписок
CREATE INDEX idx_session_messages ON ai_diary_messages(session_id, created_at);
```

### API Endpoints

#### 1. Webhook: Отправка сообщения

**Endpoint:** `POST https://mentalbalans.com/webhook/ai-diary-message`

**Request:**
```json
{
  "userJwt": "eyJhbGciOiJIUzI1NiIs...",
  "user_id": "uuid-of-user",
  "message": "Сегодня был стресс",
  "session_id": "uuid-of-session",
  "locale": "ru"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-of-session",
    "ai_response": "Я понимаю, что вы испытываете стресс...",
    "suggestions": [
      "🧘 Как справиться со стрессом?",
      "😌 Покажи технику релаксации",
      "📝 Расскажу что беспокоит подробнее",
      "💭 Что я могу сделать прямо сейчас?"
    ],
    "emotions": {
      "primary": "fear",
      "intensity": "moderate",
      "triggers": ["стресс", "работа"]
    },
    "analysis": {
      "cognitive_distortions": ["catastrophizing"],
      "themes": ["работа", "стресс"],
      "mood_score": 4
    },
    "saved_entry_id": "uuid-of-message",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### 2. Realtime: Подписка на сообщения

**Channel:** `ai_diary_session_{session_id}`

**Event:** `INSERT` в таблицу `ai_diary_messages`

**Payload:**
```json
{
  "new": {
    "id": "uuid",
    "session_id": "uuid",
    "message_type": "ai",
    "ai_response": "Текст ответа AI",
    "suggestions": ["..."],
    "emotions": {...},
    "analysis": {...},
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

## 🔧 Настройка и конфигурация

### Режимы работы

#### Production Mode (по умолчанию)

```typescript
// src/services/ai-diary.service.ts
const USE_MOCK = false; // ✅ Production

// Характеристики:
// - Реальные запросы к webhook
// - Fallback timeout: 30 секунд
// - Realtime работает
// - История и статистика сохраняются
```

#### Mock Mode (для разработки)

```typescript
// src/services/ai-diary.service.ts
const USE_MOCK = true; // 🧪 Development

// Характеристики:
// - Локальная имитация ответов
// - Задержка: 2 секунды
// - Fallback timeout: 1.2 секунды
// - Realtime НЕ работает (данные не в БД)
// - История НЕ сохраняется
```

### Environment Variables

```env
# Supabase (автоматически из Lovable Cloud)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Webhook (хардкод в коде)
WEBHOOK_URL=https://mentalbalans.com/webhook/ai-diary-message
```

### Настройка Realtime

**Важно:** Для работы Realtime подписок необходимо:

1. Включить публикацию для таблицы:
```sql
ALTER PUBLICATION supabase_realtime 
ADD TABLE ai_diary_messages;
```

2. Настроить REPLICA IDENTITY:
```sql
ALTER TABLE ai_diary_messages 
REPLICA IDENTITY FULL;
```

---

## 🐛 Отладка и диагностика

### Детальное логирование (v14)

Система использует структурированное логирование с группировкой для удобства:

```typescript
// Отправка сообщения
🤖 AI Diary - Send Message
  📤 Request: { 
    userId: "xxx", 
    sessionId: "ai_diary_xxx", 
    messageLength: 25,
    timestamp: "2025-01-11T..."
  }
  📥 API Response: { 
    success: true, 
    hasAiResponse: true, 
    hasSuggestions: 4,
    hasEmotions: true,
    savedEntryId: "xxx",
    sessionId: "ai_diary_xxx"
  }

// Realtime события
📨 Realtime Message Received
  Message ID: 2e48443d-aab1-4d58-8460-8fc7ff3c2f5c
  Session ID: ai_diary_1760217818526_oyo5559a7
  Has AI Response: true
  Has Suggestions: 4
  Timestamp: 2025-01-11T...

// Fallback механизм
⚠️ Realtime timeout - using fallback response
Fallback data: { 
  messageId: "xxx",
  hasResponse: true 
}

// Ошибки
❌ AI Diary Error
  Error details: { message: "...", stack: "..." }
  Response status: 500
  Response data: { error: "..." }
```

### Валидация API ответов

Система автоматически проверяет корректность ответов:

- ✅ Формат ответа (`typeof response.data === 'object'`)
- ✅ Поле `success: true`
- ✅ Обязательные поля: `ai_response`, `suggestions`, `emotions`, `analysis`, `session_id`
- ⚠️ Логирует предупреждения о недостающих полях (но продолжает работу)

### Обработка ошибок

Специфичные сообщения для разных типов ошибок:

| Код | Сообщение пользователю | Консоль |
|-----|------------------------|---------|
| 401 | "Ошибка авторизации. Попробуйте перелогиниться" | Response status + data |
| 500 | "Ошибка сервера. Попробуйте позже" | Full error details |
| Network | "Нет связи с сервером. Проверьте подключение" | No response received |
| Other | Детальное описание | Request setup error |

### Debug инструменты

#### 1. Copy JWT Button
- **Расположение:** Правый верхний угол AI Diary страницы (зеленая кнопка)
- **Назначение:** Копирование JWT токена для тестирования n8n webhook
- **Формат вывода:**
  ```powershell
  $JWT = "eyJhbGci..."
  $USER_ID = "808fb59f-..."
  ```
- **Где использовать:** В n8n для debug или в PowerShell для curl запросов

#### 2. Тестовая страница интеграции
- **Файл:** `public/test-ai-diary.html`
- **URL:** `http://localhost:8080/test-ai-diary.html`
- **Функции:**
  - ✅ Проверка авторизации Supabase
  - ✅ Проверка активной AI Diary сессии
  - ✅ Прямой тест webhook с детальным выводом
  - ✅ Полный интеграционный тест (все в одном)
- **Использование:**
  1. Откройте страницу в браузере
  2. Нажмите "Проверить авторизацию"
  3. Нажмите "Тестовый запрос к webhook"
  4. Проверьте вывод в консоли и на странице

#### 3. DevTools Console тесты
Быстрая проверка в консоли браузера:
```javascript
// Проверка текущей сессии
localStorage.getItem('ai_diary_session_id');

// Проверка Supabase сессии
(await supabase.auth.getSession()).data.session;

// Полный тест (на test-ai-diary.html)
runFullTest();
```

### Типичные проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| "AI печатает..." зависает | Realtime не подписан / таймаут 30с истек | Проверить подписку, проверить n8n executions |
| Дубликаты сообщений | Realtime + Fallback сработали одновременно | Система автоматически фильтрует по `id` |
| Нет ответа в Mock режиме | `USE_MOCK = true` но Realtime ждет INSERT | Переключить `USE_MOCK = false` |
| История не загружается | Неверный `session_id` в localStorage | Очистить localStorage, начать новую сессию |
| 401 Unauthorized | JWT токен истек | Перелогиниться в приложении |
| Ошибка валидации | API вернул некорректные данные | Проверить n8n workflow, логи webhook |

### Production Checklist

Перед деплоем убедитесь:
- [x] `USE_MOCK = false` в `ai-diary.service.ts`
- [x] Fallback timeout = 30000 (30 секунд)
- [x] Realtime подписка активна для таблицы `ai_diary_messages`
- [x] n8n workflow v14 активен и работает
- [x] Все обязательные поля возвращаются в API ответе
- [x] Логирование настроено и читаемо
- [x] Тестовая страница работает корректно

---

## 📊 Метрики и аналитика

### Собираемые данные

**На уровне сессии:**
- Общее количество сообщений (`message_count`)
- Длительность сессии (`duration_seconds`)
- Основная эмоция (`primary_emotion`)
- Темы разговоров (`themes[]`)
- Средний mood score (`average_mood_score`)

**На уровне сообщения:**
- Тип сообщения (`message_type`)
- Время создания (`created_at`)
- Эмоциональный анализ (`emotions`)
- Когнитивные искажения (`analysis.cognitive_distortions`)

### Компонент статистики

```typescript
// src/hooks/useAIDiaryAnalytics.ts
const { stats, isLoading } = useAIDiaryAnalytics();

// stats содержит:
{
  totalSessions: 15,
  activeSessions: 1,
  totalMessages: 234,
  averageMessages: 15.6,
  averageDuration: 1200, // секунды
  lastActivity: "2025-01-15T10:30:00Z",
  topEmotions: ["trust", "joy", "fear"]
}
```

---

## 🚀 Roadmap и улучшения

### v15 - Планируемые функции

- [ ] Индикатор "сохранено" для каждого сообщения (✓/pending)
- [ ] Экспорт истории в PDF/TXT
- [ ] Поиск по сообщениям
- [ ] Теги и категории сессий
- [ ] Визуализация эмоций (графики за период)
- [ ] Голосовой ввод/вывод (Web Speech API)
- [ ] Мультиязычность (en, uk)
- [ ] Dashboard с аналитикой эмоций
- [ ] Уведомления о когнитивных искажениях
- [ ] Персонализированные рекомендации на основе истории
- [ ] Напоминания о ведении дневника

### Оптимизации

- [ ] Пагинация для длинных сессий
- [ ] Lazy loading истории
- [ ] Кэширование ответов AI
- [ ] Оптимизация Realtime (batching)
- [ ] Service Worker для offline режима

---

## 📝 Changelog

### v14.0 (Production Ready) - 2025-01-11

✅ **Добавлено:**
- Детальное структурированное логирование с группировкой
- Автоматическая валидация API ответов
- Улучшенная обработка ошибок (401, 500, network)
- Отображение эмоций с эмодзи (😊, 🤗, 😰, etc.)
- Отображение mood score (шкала 1-10)
- Тестовая страница интеграции `/public/test-ai-diary.html`
- Debug кнопка Copy JWT в правом верхнем углу
- Специфичные сообщения об ошибках для пользователей

✅ **Улучшено:**
- Логирование теперь использует console.group() для читаемости
- Проверка обязательных полей в API ответе
- Сообщения об ошибках более информативные
- Визуализация эмоционального состояния

✅ **Исправлено:**
- USE_MOCK переключен на false для production
- Fallback timeout установлен на 30 секунд
- Улучшена обработка сетевых ошибок

### v1.2.0

✅ **Добавлено:**
- Динамический fallback timeout (1.2s для mock, 30s для prod)
- Немедленная подписка на Realtime при создании сессии
- Флаг `is_mock` в ответах API
- Улучшенная защита от дубликатов

✅ **Исправлено:**
- Зависание индикатора "AI печатает..." в mock режиме
- Пропуск Realtime событий при быстром создании сессии
- Конфликт между Realtime и Fallback

### v1.1.0

✅ **Добавлено:**
- Компонент статистики `AIDiaryStats`
- Управление сессиями (новая/завершить)
- Эффект печати для AI ответов
- QuickSuggestions под сообщениями

### v1.0.0

✅ **Релиз:**
- Базовый чат с AI
- Realtime подписки
- Сохранение истории
- Эмоциональный анализ

---

## 📞 Контакты и поддержка

- **Документация проекта:** `/docs/AI-DIARY.md`
- **Исходный код:** `/src/components/dashboard/ai-diary/`
- **API документация:** (внутренняя, n8n webhook)

---

*Документация обновлена: 2025-01-11*
*Версия системы: 14.0 (Production Ready)*