import { useAIDiaryChat } from '@/hooks/useAIDiaryChat';
import FreeChatHeader from './FreeChatHeader';
import FreeChatMessages from './FreeChatMessages';
import FreeChatInput from './FreeChatInput';
import AIDiaryStats from './AIDiaryStats';
import DebugJwtButton from './DebugJwtButton';

export default function FreeChat() {
  const {
    messages,
    sessionId,
    isLoading,
    isTyping,
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
      
      {/* Хедер с управлением */}
      <FreeChatHeader 
        sessionId={sessionId}
        onNewSession={startNewSession}
        onEndSession={endSession}
      />
      
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
