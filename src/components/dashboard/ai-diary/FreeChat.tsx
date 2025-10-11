import { useAIDiaryChat } from '@/hooks/useAIDiaryChat';
import FreeChatHeader from './FreeChatHeader';
import FreeChatMessages from './FreeChatMessages';
import FreeChatInput from './FreeChatInput';
import QuickSuggestions from './QuickSuggestions';

export default function FreeChat() {
  const {
    messages,
    isLoading,
    suggestions,
    currentSession,
    sendMessage,
    startNewSession,
    endCurrentSession
  } = useAIDiaryChat();

  return (
    <div className="flex flex-col h-full">
      <FreeChatHeader
        currentSession={currentSession}
        onNewSession={startNewSession}
        onEndSession={endCurrentSession}
      />

      <FreeChatMessages messages={messages} isLoading={isLoading} />

      {suggestions.length > 0 && (
        <QuickSuggestions
          suggestions={suggestions}
          onSelectSuggestion={sendMessage}
          disabled={isLoading}
        />
      )}

      <FreeChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
