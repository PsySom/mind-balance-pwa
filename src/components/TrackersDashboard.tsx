import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TrackerForm from './TrackerForm';
import TrackerHistoryFromSupabase from './TrackerHistoryFromSupabase';

export default function TrackersDashboard() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    getSession();
  }, []);

  const handleSubmit = () => {
    // Refresh is handled by TrackerHistoryFromSupabase
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-fade-in">
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold">Отслеживание состояния</h2>
        <TrackerForm onSubmitSuccess={handleSubmit} />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold">История</h2>
        {userId && (
          <TrackerHistoryFromSupabase userId={userId} />
        )}
      </div>
    </div>
  );
}
