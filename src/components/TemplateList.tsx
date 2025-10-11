import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types/activity';
import { CATEGORY_LABELS } from '@/types/activity';
import TemplateCard from './TemplateCard';

interface TemplateListProps {
  onPlay: (template: Template) => void;
  onSchedule: (template: Template) => void;
}

export default function TemplateList({ onPlay, onSchedule }: TemplateListProps) {
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
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .eq('is_active', true)
        .order('title->ru');

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
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
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
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
            <TemplateCard
              key={template.id}
              template={template}
              onPlay={onPlay}
              onSchedule={onSchedule}
            />
          ))}
        </div>
      )}
    </div>
  );
}
