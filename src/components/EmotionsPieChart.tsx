import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface EmotionsPieChartProps {
  data: Array<{ emotion: string; count: number }>;
}

const emotionColors: Record<string, string> = {
  fear: '#a855f7',
  joy: '#eab308',
  sadness: '#3b82f6',
  anger: '#ef4444',
  disgust: '#22c55e',
  trust: '#14b8a6',
  surprise: '#ec4899',
  anticipation: '#f97316',
};

const emotionLabels: Record<string, string> = {
  fear: 'Страх',
  joy: 'Радость',
  sadness: 'Грусть',
  anger: 'Гнев',
  disgust: 'Отвращение',
  trust: 'Доверие',
  surprise: 'Удивление',
  anticipation: 'Предвкушение',
};

export default function EmotionsPieChart({ data }: EmotionsPieChartProps) {
  const chartData = data.map(item => ({
    name: emotionLabels[item.emotion] || item.emotion,
    value: item.count,
    color: emotionColors[item.emotion] || '#666',
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Распределение эмоций</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
