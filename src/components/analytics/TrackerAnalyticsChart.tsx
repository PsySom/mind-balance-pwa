import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  userId: string;
  days: number;
}

export function TrackerAnalyticsChart({ userId, days }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Загрузка данных из tracker_records
  const { data: trackerData, isLoading } = useQuery({
    queryKey: ['tracker-analytics', userId, days],
    queryFn: async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await supabase
        .from('tracker_records')
        .select('created_at, mood, stress, energy, process_satisfaction, result_satisfaction')
        .eq('user_id', userId)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Группировка по датам
      const grouped = new Map();
      data.forEach(record => {
        const date = new Date(record.created_at).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'short'
        });
        
        if (!grouped.has(date)) {
          grouped.set(date, {
            mood: [],
            stress: [],
            energy: [],
            process_satisfaction: [],
            result_satisfaction: []
          });
        }
        
        const entry = grouped.get(date);
        if (record.mood) entry.mood.push(record.mood);
        if (record.stress) entry.stress.push(record.stress);
        if (record.energy) entry.energy.push(record.energy);
        if (record.process_satisfaction) entry.process_satisfaction.push(record.process_satisfaction);
        if (record.result_satisfaction) entry.result_satisfaction.push(record.result_satisfaction);
      });

      // Формат для ECharts dataset
      const dates = Array.from(grouped.keys());
      const moodAvg = dates.map(date => {
        const values = grouped.get(date).mood;
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
      });
      const stressAvg = dates.map(date => {
        const values = grouped.get(date).stress;
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
      });
      const energyAvg = dates.map(date => {
        const values = grouped.get(date).energy;
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
      });
      const procSatAvg = dates.map(date => {
        const values = grouped.get(date).process_satisfaction;
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
      });
      const resSatAvg = dates.map(date => {
        const values = grouped.get(date).result_satisfaction;
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
      });

      return {
        dates,
        mood: moodAvg,
        stress: stressAvg,
        energy: energyAvg,
        process_satisfaction: procSatAvg,
        result_satisfaction: resSatAvg
      };
    }
  });

  useEffect(() => {
    if (!chartRef.current || !trackerData || isLoading) return;

    // Инициализация графика
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option = {
      legend: {
        data: ['Настроение', 'Стресс', 'Энергия', 'Удовл. процессом', 'Удовл. результатом'],
        top: 0
      },
      tooltip: {
        trigger: 'axis',
        showContent: false
      },
      dataset: {
        source: [
          ['date', ...trackerData.dates],
          ['Настроение', ...trackerData.mood],
          ['Стресс', ...trackerData.stress],
          ['Энергия', ...trackerData.energy],
          ['Удовл. процессом', ...trackerData.process_satisfaction],
          ['Удовл. результатом', ...trackerData.result_satisfaction]
        ]
      },
      xAxis: { 
        type: 'category',
        boundaryGap: false
      },
      yAxis: { 
        gridIndex: 0,
        min: 0,
        max: 10,
        interval: 2
      },
      grid: { 
        top: '55%',
        left: '10%',
        right: '10%',
        bottom: '10%'
      },
      series: [
        {
          name: 'Настроение',
          type: 'line',
          smooth: true,
          seriesLayoutBy: 'row',
          emphasis: { focus: 'series' },
          lineStyle: { color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Стресс',
          type: 'line',
          smooth: true,
          seriesLayoutBy: 'row',
          emphasis: { focus: 'series' },
          lineStyle: { color: '#ef4444' },
          itemStyle: { color: '#ef4444' }
        },
        {
          name: 'Энергия',
          type: 'line',
          smooth: true,
          seriesLayoutBy: 'row',
          emphasis: { focus: 'series' },
          lineStyle: { color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' }
        },
        {
          name: 'Удовл. процессом',
          type: 'line',
          smooth: true,
          seriesLayoutBy: 'row',
          emphasis: { focus: 'series' },
          lineStyle: { color: '#10b981' },
          itemStyle: { color: '#10b981' }
        },
        {
          name: 'Удовл. результатом',
          type: 'line',
          smooth: true,
          seriesLayoutBy: 'row',
          emphasis: { focus: 'series' },
          lineStyle: { color: '#8b5cf6' },
          itemStyle: { color: '#8b5cf6' }
        },
        {
          type: 'pie',
          id: 'pie',
          radius: '30%',
          center: ['50%', '25%'],
          emphasis: { focus: 'self' },
          label: {
            formatter: '{b}: {@1} ({d}%)'
          },
          encode: {
            itemName: 0,
            value: 1,
            tooltip: 1
          }
        }
      ]
    };

    // Интерактивность: обновление pie при наведении на линии
    chartInstance.current.on('updateAxisPointer', (event: any) => {
      const xAxisInfo = event.axesInfo?.[0];
      if (xAxisInfo) {
        const dimension = xAxisInfo.value + 1;
        chartInstance.current?.setOption({
          series: {
            id: 'pie',
            label: {
              formatter: '{b}: {@[' + dimension + ']} ({d}%)'
            },
            encode: {
              value: dimension,
              tooltip: dimension
            }
          }
        });
      }
    });

    chartInstance.current.setOption(option);

    // Resize handling
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [trackerData, isLoading]);

  if (isLoading) {
    return <div className="h-[500px] flex items-center justify-center">Загрузка...</div>;
  }

  if (!trackerData || trackerData.dates.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
        Нет данных за выбранный период
      </div>
    );
  }

  return <div ref={chartRef} className="h-[500px] w-full" />;
}
