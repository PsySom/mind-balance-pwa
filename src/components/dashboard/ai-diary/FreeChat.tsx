import { useAIDiaryChat } from '@/hooks/useAIDiaryChat';
import FreeChatHeader from './FreeChatHeader';
import FreeChatMessages from './FreeChatMessages';
import FreeChatInput from './FreeChatInput';
import QuickSuggestions from './QuickSuggestions';

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

  // Получаем suggestions из последнего сообщения
  const suggestions = messages.length > 0 
    ? messages[messages.length - 1]?.suggestions || []
    : [];

  return (
    <div className="flex flex-col h-full">
      <FreeChatHeader
        hasActiveSession={!!sessionId}
        onNewSession={startNewSession}
        onEndSession={endSession}
      />

      <FreeChatMessages messages={messages} isTyping={isTyping} />

      {suggestions.length > 0 && (
        <QuickSuggestions
          suggestions={suggestions}
          onSelectSuggestion={handleSuggestionClick}
          disabled={isLoading || isTyping}
        />
      )}

      <FreeChatInput onSend={sendMessage} isLoading={isLoading || isTyping} />
    </div>
  );
}
