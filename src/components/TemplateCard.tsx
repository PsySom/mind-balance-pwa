import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Plus } from 'lucide-react';

interface ActivityTemplate {
  id: string;
  title: { ru: string };
  description?: { ru?: string };
  category: 'self_care' | 'task' | 'habit' | 'ritual';
  duration_min: number;
  difficulty_level: number;
}

interface TemplateCardProps {
  template: ActivityTemplate;
  onAddToPlan: (template: ActivityTemplate) => void;
}

const categoryConfig = {
  self_care: { label: 'Забота о себе', color: 'bg-green-500' },
  task: { label: 'Задача', color: 'bg-blue-500' },
  habit: { label: 'Привычка', color: 'bg-purple-500' },
  ritual: { label: 'Ритуал', color: 'bg-orange-500' },
};

export default function TemplateCard({ template, onAddToPlan }: TemplateCardProps) {
  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < level ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{template.title.ru}</h4>
            <Badge variant="secondary" className="text-xs shrink-0">
              <div className={`w-2 h-2 rounded-full ${categoryConfig[template.category].color} mr-1`} />
              {categoryConfig[template.category].label}
            </Badge>
          </div>
          
          {template.description?.ru && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {template.description.ru}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{template.duration_min} мин</span>
          </div>
          <div className="flex items-center gap-0.5">
            {renderStars(template.difficulty_level)}
          </div>
        </div>

        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => onAddToPlan(template)}
        >
          <Plus className="w-4 h-4" />
          Добавить в план
        </Button>
      </div>
    </Card>
  );
}
