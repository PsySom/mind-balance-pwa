import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import TemplateCard from './TemplateCard';

interface ActivityTemplate {
  id: string;
  title: { ru: string };
  description?: { ru?: string };
  category: 'self_care' | 'task' | 'habit' | 'ritual';
  duration_min: number;
  difficulty_level: number;
}

interface TemplateListProps {
  onSelectTemplate: (template: ActivityTemplate) => void;
}

const SUPABASE_URL = 'https://wzgmfdtqxtuzujipoimc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z21mZHRxeHR1enVqaXBvaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5Nzc5NzIsImV4cCI6MjA3NDU1Mzk3Mn0.6uBF_pdzy8PjSAPOvGwSonmWul8YYHBDwAMHz7Tytb8';

export default function TemplateList({ onSelectTemplate }: TemplateListProps) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ActivityTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, difficultyFilter]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_templates?is_active=eq.true`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при загрузке шаблонов');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Поиск по названию
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.ru.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Фильтр по сложности
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(
        template => template.difficulty_level === parseInt(difficultyFilter)
      );
    }

    setFilteredTemplates(filtered);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-muted-foreground">Загрузка шаблонов...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="search">Поиск</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Категория</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="self_care">Забота о себе</SelectItem>
              <SelectItem value="task">Задача</SelectItem>
              <SelectItem value="habit">Привычка</SelectItem>
              <SelectItem value="ritual">Ритуал</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Сложность</Label>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger id="difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="1">⭐ Очень легко</SelectItem>
              <SelectItem value="2">⭐⭐ Легко</SelectItem>
              <SelectItem value="3">⭐⭐⭐ Средне</SelectItem>
              <SelectItem value="4">⭐⭐⭐⭐ Сложно</SelectItem>
              <SelectItem value="5">⭐⭐⭐⭐⭐ Очень сложно</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Шаблоны не найдены</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onAddToPlan={onSelectTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
