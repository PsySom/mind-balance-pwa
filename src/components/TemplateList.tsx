import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  title: { ru: string };
  description: { ru: string };
  category: 'self_care' | 'task' | 'habit' | 'ritual' | 'routine';
  duration_min: number;
  difficulty_level: number;
  is_active: boolean;
}

interface TemplateListProps {
  onSelectTemplate: (template: Template) => void;
}

const categoryLabels = {
  self_care: { label: 'Забота о себе', color: 'bg-green-500' },
  task: { label: 'Задача', color: 'bg-blue-500' },
  habit: { label: 'Привычка', color: 'bg-purple-500' },
  ritual: { label: 'Ритуал', color: 'bg-orange-500' },
  routine: { label: 'Рутина', color: 'bg-pink-500' },
};

export default function TemplateList({ onSelectTemplate }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, difficultyFilter]);

  const fetchTemplates = async () => {
    console.log('📚 Fetching templates from Supabase...');
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .eq('is_active', true)
        .order('title->ru');

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Templates loaded:', data);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить шаблоны',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(t =>
        t.title.ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.ru.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Фильтр по сложности
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(t => t.difficulty_level === parseInt(difficultyFilter));
    }

    setFilteredTemplates(filtered);
  };

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < level ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {Object.entries(categoryLabels).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Сложность" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любая сложность</SelectItem>
            <SelectItem value="1">⭐ Очень легко</SelectItem>
            <SelectItem value="2">⭐⭐ Легко</SelectItem>
            <SelectItem value="3">⭐⭐⭐ Средне</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ Сложно</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ Очень сложно</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Результаты */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Шаблоны не найдены</p>
          <p className="text-sm text-muted-foreground mt-1">
            Попробуйте изменить фильтры
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-4 space-y-3 hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <h3 className="font-semibold line-clamp-1">{template.title.ru}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description.ru}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      categoryLabels[template.category].color
                    } mr-1`}
                  />
                  {categoryLabels[template.category].label}
                </Badge>

                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  {template.duration_min} мин
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  {renderStars(template.difficulty_level)}
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectTemplate(template)}
                >
                  Использовать
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
