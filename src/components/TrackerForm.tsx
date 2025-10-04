import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/lib/config';

interface TrackerData {
  mood: number;
  stress: number;
  energy: number;
  process_satisfaction: number;
  result_satisfaction: number;
  note: string;
}

interface TrackerFormProps {
  onSubmitSuccess: (data: TrackerData & { timestamp: Date }) => void;
}

export default function TrackerForm({ onSubmitSuccess }: TrackerFormProps) {
  const [values, setValues] = useState<TrackerData>({
    mood: 5,
    stress: 5,
    energy: 5,
    process_satisfaction: 5,
    result_satisfaction: 5,
    note: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserJwt(session.access_token);
      }
    };
    getSession();
  }, []);

  const handleSliderChange = (key: 'mood' | 'stress' | 'energy' | 'process_satisfaction' | 'result_satisfaction', value: number[]) => {
    setValues(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleSubmit = async () => {
    if (!userJwt || !userId) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить данные пользователя',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(config.webhooks.tracker, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userJwt,
          user_id: userId,
          ...values,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении данных');
      }

      toast({
        title: 'Трекер сохранен',
        description: 'Ваши данные отслеживания записаны',
      });

      // Инвалидировать React Query кэш
      queryClient.invalidateQueries({ queryKey: ['tracker-records'] });

      onSubmitSuccess({ ...values, timestamp: new Date() });

      // Сброс формы
      setValues({
        mood: 5,
        stress: 5,
        energy: 5,
        process_satisfaction: 5,
        result_satisfaction: 5,
        note: '',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить данные',
        variant: 'destructive',
      });
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sliders: Array<{ key: 'mood' | 'stress' | 'energy' | 'process_satisfaction' | 'result_satisfaction'; label: string; color: string; description: string }> = [
    { key: 'mood', label: 'Настроение', color: 'bg-blue-500', description: 'Как вы себя чувствуете эмоционально?' },
    { key: 'stress', label: 'Стресс', color: 'bg-red-500', description: 'Уровень напряжения и тревоги' },
    { key: 'energy', label: 'Энергия', color: 'bg-green-500', description: 'Физическая и ментальная бодрость' },
    { key: 'process_satisfaction', label: 'Удовлетворённость процессом', color: 'bg-purple-500', description: 'Насколько вам нравится то, чем вы занимаетесь' },
    { key: 'result_satisfaction', label: 'Удовлетворённость результатом', color: 'bg-orange-500', description: 'Довольны ли вы результатами своей работы' },
  ];

  return (
    <Card className="p-6 space-y-6 animate-fade-in">
      <div className="space-y-6">
        {sliders.map(({ key, label, color, description }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <span className="text-lg font-semibold tabular-nums">{values[key]}/10</span>
            </div>
            <Slider
              value={[values[key]]}
              onValueChange={(value) => handleSliderChange(key, value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Заметка (опционально)</Label>
        <Textarea
          id="note"
          value={values.note}
          onChange={(e) => setValues(prev => ({ ...prev, note: e.target.value }))}
          placeholder="Добавьте заметку о вашем состоянии..."
          className="min-h-[100px]"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          'Сохранить'
        )}
      </Button>
    </Card>
  );
}
