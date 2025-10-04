import { AlertCircle, Smile, Frown, Flame, XCircle, Shield, Sparkles, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmotionCardProps {
  primary: string;
  intensity: string;
  triggers: string[];
}

const emotionConfig = {
  fear: { name: 'Страх', icon: AlertCircle, color: 'text-purple-500' },
  joy: { name: 'Радость', icon: Smile, color: 'text-yellow-500' },
  sadness: { name: 'Грусть', icon: Frown, color: 'text-blue-500' },
  anger: { name: 'Гнев', icon: Flame, color: 'text-red-500' },
  disgust: { name: 'Отвращение', icon: XCircle, color: 'text-green-500' },
  trust: { name: 'Доверие', icon: Shield, color: 'text-teal-500' },
  surprise: { name: 'Удивление', icon: Sparkles, color: 'text-pink-500' },
  anticipation: { name: 'Предвкушение', icon: Clock, color: 'text-orange-500' },
};

const intensityConfig = {
  low: { label: 'Низкая', color: 'bg-green-500' },
  moderate: { label: 'Средняя', color: 'bg-yellow-500' },
  high: { label: 'Высокая', color: 'bg-red-500' },
};

export default function EmotionCard({ primary, intensity, triggers }: EmotionCardProps) {
  const emotion = emotionConfig[primary as keyof typeof emotionConfig];
  const intensityInfo = intensityConfig[intensity as keyof typeof intensityConfig];
  
  if (!emotion || !intensityInfo) return null;

  const EmotionIcon = emotion.icon;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <EmotionIcon className={`w-6 h-6 ${emotion.color}`} />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{emotion.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className={`h-full rounded-full ${intensityInfo.color} transition-all`}
                style={{ width: intensity === 'low' ? '33%' : intensity === 'moderate' ? '66%' : '100%' }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{intensityInfo.label}</span>
          </div>
        </div>
      </div>
      
      {triggers && triggers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Триггеры:</p>
          <div className="flex flex-wrap gap-1">
            {triggers.map((trigger, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {trigger}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
