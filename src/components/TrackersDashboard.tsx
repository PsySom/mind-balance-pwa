import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TrackerForm from './TrackerForm';
import TrackerHistoryFromSupabase from './TrackerHistoryFromSupabase';

export default function TrackersDashboard() {
  const [userId, setUserId] = useState<string>('');
  const [userJwt, setUserJwt] = useState<string>('');

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

  const handleSubmit = () => {
    // Отправка обрабатывается внутри TrackerForm
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Отслеживание состояния</h2>
        <TrackerForm onSubmitSuccess={handleSubmit} />
      </div>
      <div>
        {userId && (
          <TrackerHistoryFromSupabase userId={userId} />
        )}
      </div>
    </div>
  );
}
