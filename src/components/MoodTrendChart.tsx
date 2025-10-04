import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MoodTrendChartProps {
  data: Array<{ date: string; mood_score: number }>;
}

export default function MoodTrendChart({ data }: MoodTrendChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item?.date || new Date().toISOString()), 'dd MMM', { locale: ru }),
    mood_score: item?.mood_score || 0,
  }));

  const getMoodColor = (value: number) => {
    if (value <= 3) return '#ef4444';
    if (value <= 6) return '#eab308';
    return '#22c55e';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Динамика настроения (30 дней)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="dateFormatted" 
            tick={{ fontSize: 12 }}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          />
          <Line 
            type="monotone" 
            dataKey="mood_score" 
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
