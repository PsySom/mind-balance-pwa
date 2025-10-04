import { useState } from 'react';
import TrackerForm from './TrackerForm';
import LocalTrackerHistory from './LocalTrackerHistory';

interface TrackerEntry {
  mood: number;
  stress: number;
  energy: number;
  process_satisfaction: number;
  result_satisfaction: number;
  note: string;
  timestamp: Date;
}

export default function TrackersDashboard() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);

  const handleNewEntry = (entry: TrackerEntry) => {
    setEntries(prev => [entry, ...prev].slice(0, 20)); // Храним последние 20 записей
  };

  // Фильтруем записи за последние 7 дней
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentEntries = entries.filter(entry => entry.timestamp >= sevenDaysAgo);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Отслеживание состояния</h2>
        <TrackerForm onSubmitSuccess={handleNewEntry} />
      </div>
      <div>
        <LocalTrackerHistory entries={recentEntries} />
      </div>
    </div>
  );
}
