import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, User, Bot, Brain, Heart } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useAIDiaryChat';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import EmotionBadge from '@/components/EmotionBadge';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Card className={`p-4 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs opacity-70 mt-2">
            {format(new Date(message.timestamp), 'HH:mm', { locale: ru })}
          </p>
        </Card>

        {/* Эмоции и анализ для AI сообщений */}
        {!isUser && (message.emotions || message.analysis) && (
          <Collapsible open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {isAnalysisOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Скрыть анализ
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Показать анализ
                  </>
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Card className="p-4 space-y-3">
                {message.emotions && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Heart className="w-4 h-4" />
                      Эмоции
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <EmotionBadge
                        emotion={message.emotions.primary}
                        intensity={message.emotions.intensity as 'low' | 'moderate' | 'high'}
                      />
                      {message.emotions.triggers && message.emotions.triggers.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Триггеры: {message.emotions.triggers.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.analysis && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Brain className="w-4 h-4" />
                      Анализ
                    </div>
                    
                    {message.analysis.mood_score && (
                      <div className="text-sm">
                        <span className="font-medium">Настроение:</span>{' '}
                        <Badge variant="outline">{message.analysis.mood_score}/10</Badge>
                      </div>
                    )}

                    {message.analysis.themes && message.analysis.themes.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Темы:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {message.analysis.themes.map((theme, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.analysis.cognitive_distortions && message.analysis.cognitive_distortions.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Когнитивные искажения:</span>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground">
                          {message.analysis.cognitive_distortions.map((distortion, index) => (
                            <li key={index}>{distortion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
