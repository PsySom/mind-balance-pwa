import { useAIDiaryChat } from '@/hooks/useAIDiaryChat';
import FreeChatHeader from './FreeChatHeader';
import FreeChatMessages from './FreeChatMessages';
import FreeChatInput from './FreeChatInput';
import AIDiaryStats from './AIDiaryStats';
import DebugJwtButton from './DebugJwtButton';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FreeChat() {
  const {
    messages,
    sessionId,
    isLoading,
    isTyping,
    sessionStatus,
    realtimeChannel,
    sendMessage,
    startNewSession,
    endSession,
    handleSuggestionClick
  } = useAIDiaryChat();
  
  return (
    <div className="flex flex-col h-full">
      {/* Debug кнопка для копирования JWT */}
      <DebugJwtButton />
      
      {/* Статистика сверху */}
      <AIDiaryStats sessionId={sessionId} />
      
      {/* Хедер с управлением и индикатором статуса */}
      <div className="flex items-center justify-between mb-4 px-4 py-2 border-b">
        <FreeChatHeader 
          sessionId={sessionId}
          onNewSession={startNewSession}
          onEndSession={endSession}
        />
        
        {/* ИНДИКАТОР СТАТУСА ПОДКЛЮЧЕНИЯ */}
        <div className="flex items-center gap-2 text-xs">
          {sessionStatus === 'loading' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Загрузка...</span>
            </>
          )}
          {sessionStatus === 'active' && realtimeChannel && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 dark:text-green-400">Подключено</span>
            </>
          )}
          {sessionStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-destructive" />
              <span className="text-destructive">Ошибка</span>
            </>
          )}
        </div>
      </div>
      
      {/* Список сообщений */}
      <FreeChatMessages 
        messages={messages}
        isTyping={isTyping}
        onSuggestionClick={handleSuggestionClick}
      />
      
      {/* Поле ввода */}
      <FreeChatInput 
        onSend={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
