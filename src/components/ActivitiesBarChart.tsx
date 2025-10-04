import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface ActivitiesBarChartProps {
  data: Array<{ category: string; count: number }>;
}

const categoryLabels: Record<string, string> = {
  self_care: 'Забота о себе',
  task: 'Задача',
  habit: 'Привычка',
  ritual: 'Ритуал',
};

const categoryColors: Record<string, string> = {
  self_care: '#22c55e',
  task: '#3b82f6',
  habit: '#a855f7',
  ritual: '#f97316',
};

export default function ActivitiesBarChart({ data }: ActivitiesBarChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
    name: categoryLabels[item?.category] || item?.category || 'Неизвестно',
    count: item?.count || 0,
    fill: categoryColors[item?.category] || '#666',
  })).filter(item => item.count > 0);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Выполненные активности по категориям</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
