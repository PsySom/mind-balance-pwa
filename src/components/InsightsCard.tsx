import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface InsightsCardProps {
  cognitive_distortions: string[];
  themes: string[];
  mood_score: number;
}

export default function InsightsCard({ cognitive_distortions, themes, mood_score }: InsightsCardProps) {
  const getMoodColor = (score: number) => {
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMoodLabel = (score: number) => {
    if (score <= 3) return 'Низкое настроение';
    if (score <= 6) return 'Среднее настроение';
    return 'Хорошее настроение';
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      {cognitive_distortions && cognitive_distortions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Когнитивные искажения:
          </p>
          <div className="space-y-1">
            {cognitive_distortions.map((distortion, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs bg-background rounded p-2">
                <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <span>{distortion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {themes && themes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Темы:</p>
          <div className="flex flex-wrap gap-1">
            {themes.map((theme, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {mood_score !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-muted-foreground">Настроение:</p>
            <span className="text-xs">{mood_score}/10</span>
          </div>
          <div className="space-y-1">
            <Progress value={mood_score * 10} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">{getMoodLabel(mood_score)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
