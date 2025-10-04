import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrackerTrendChartProps {
  data: Array<{
    date: string;
    mood: number;
    stress: number;
    energy: number;
    process_satisfaction: number;
    result_satisfaction: number;
  }>;
}

export default function TrackerTrendChart({ data }: TrackerTrendChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item?.date || new Date().toISOString()), 'dd MMM', { locale: ru }),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Динамика трекеров (неделя)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Legend />
          <Line type="monotone" dataKey="mood" stroke="#3b82f6" name="Настроение" strokeWidth={2} />
          <Line type="monotone" dataKey="stress" stroke="#ef4444" name="Стресс" strokeWidth={2} />
          <Line type="monotone" dataKey="energy" stroke="#22c55e" name="Энергия" strokeWidth={2} />
          <Line type="monotone" dataKey="process_satisfaction" stroke="#a855f7" name="Удовл. процессом" strokeWidth={2} />
          <Line type="monotone" dataKey="result_satisfaction" stroke="#f97316" name="Удовл. результатом" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
