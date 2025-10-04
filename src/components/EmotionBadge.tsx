import { Badge } from '@/components/ui/badge';
import { 
  Smile, 
  Heart, 
  AlertTriangle, 
  Zap, 
  CloudRain, 
  XCircle, 
  Flame, 
  TrendingUp,
  LucideIcon
} from 'lucide-react';

interface EmotionBadgeProps {
  emotion: string;
  intensity: 'low' | 'moderate' | 'high';
  size?: 'sm' | 'md' | 'lg';
}

interface EmotionConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

const emotionConfig: Record<string, EmotionConfig> = {
  joy: {
    label: 'Радость',
    icon: Smile,
    color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  },
  trust: {
    label: 'Доверие',
    icon: Heart,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  fear: {
    label: 'Страх',
    icon: AlertTriangle,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  surprise: {
    label: 'Удивление',
    icon: Zap,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  },
  sadness: {
    label: 'Грусть',
    icon: CloudRain,
    color: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  },
  disgust: {
    label: 'Отвращение',
    icon: XCircle,
    color: 'text-green-500 bg-green-500/10 border-green-500/20',
  },
  anger: {
    label: 'Гнев',
    icon: Flame,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  anticipation: {
    label: 'Предвкушение',
    icon: TrendingUp,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
};

const intensityOpacity = {
  low: 'opacity-50',
  moderate: 'opacity-75',
  high: 'opacity-100',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export default function EmotionBadge({ 
  emotion, 
  intensity, 
  size = 'md' 
}: EmotionBadgeProps) {
  const config = emotionConfig[emotion.toLowerCase()] || {
    label: emotion,
    icon: Smile,
    color: 'text-muted-foreground bg-muted border-border',
  };

  const Icon = config.icon;

  return (
    <Badge 
      variant="outline"
      className={`
        ${config.color}
        ${intensityOpacity[intensity]}
        ${sizeClasses[size]}
        inline-flex items-center font-medium
      `}
    >
      <Icon size={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  );
}
