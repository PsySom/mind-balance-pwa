import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogOut, Download, Moon, Sun, Bell, Globe, Clock, Info } from 'lucide-react';

const SUPABASE_URL = 'https://wzgmfdtqxtuzujipoimc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z21mZHRxeHR1enVqaXBvaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5Nzc5NzIsImV4cCI6MjA3NDU1Mzk3Mn0.6uBF_pdzy8PjSAPOvGwSonmWul8YYHBDwAMHz7Tytb8';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userJwt, setUserJwt] = useState<string>('');

  // App settings
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'auto');
  const [timezone, setTimezone] = useState(localStorage.getItem('timezone') || 'Europe/Moscow');

  // Notification settings (UI only)
  const [diaryReminders, setDiaryReminders] = useState('2');
  const [trackerReminders, setTrackerReminders] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        setUserJwt(session.access_token);
      }
    };
    getSession();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Вы вышли из аккаунта',
    });
    navigate('/auth');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('language', language);
    localStorage.setItem('theme', theme);
    localStorage.setItem('timezone', timezone);
    
    toast({
      title: 'Настройки сохранены',
      description: 'Ваши настройки успешно обновлены',
    });
  };

  const handleExportData = async () => {
    if (!user || !userJwt) return;

    try {
      const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${userJwt}`,
      };

      // Fetch all user data
      const [diaryResponse, trackerResponse, activitiesResponse] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/ai_diary_messages?user_id=eq.${user.id}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/tracker_records?user_id=eq.${user.id}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/activities?user_id=eq.${user.id}`, { headers }),
      ]);

      const data = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        diary_messages: diaryResponse.ok ? await diaryResponse.json() : [],
        tracker_records: trackerResponse.ok ? await trackerResponse.json() : [],
        activities: activitiesResponse.ok ? await activitiesResponse.json() : [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `psybalance-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Данные экспортированы',
        description: 'Файл успешно загружен',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-soft)' }}>
      <header className="bg-card border-b border-border px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label="Назад">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Настройки</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
        {/* Profile Section */}
        <Card className="p-4 md:p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold">Профиль пользователя</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
            <Button variant="destructive" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Выйти из аккаунта
            </Button>
          </div>
        </Card>

        {/* App Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold">Настройки приложения</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Язык</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en" disabled>English (скоро)</SelectItem>
                  <SelectItem value="fr" disabled>Français (скоро)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Тема</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Светлая
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Тёмная
                    </div>
                  </SelectItem>
                  <SelectItem value="auto">Автоматически</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Часовой пояс</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                  <SelectItem value="Europe/London">Лондон (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">Нью-Йорк (UTC-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Лос-Анджелес (UTC-8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Токио (UTC+9)</SelectItem>
                  <SelectItem value="Australia/Sydney">Сидней (UTC+10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              Сохранить настройки
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold">Уведомления</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diary-reminders">Частота напоминаний о дневнике</Label>
              <Select value={diaryReminders} onValueChange={setDiaryReminders}>
                <SelectTrigger id="diary-reminders">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 раз в день</SelectItem>
                  <SelectItem value="2">2 раза в день</SelectItem>
                  <SelectItem value="3">3 раза в день</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Напоминания о трекерах</Label>
                <p className="text-sm text-muted-foreground">
                  Получать уведомления о заполнении трекеров
                </p>
              </div>
              <Switch
                checked={trackerReminders}
                onCheckedChange={setTrackerReminders}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-time">Время уведомлений</Label>
              <Input
                id="notification-time"
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              * Функционал уведомлений находится в разработке
            </p>
          </div>
        </Card>

        {/* Export Data */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Экспорт данных</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Скачайте все ваши данные в формате JSON. Включает записи дневника, трекеры и активности.
            </p>
            <Button onClick={handleExportData} variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              Скачать мои данные
            </Button>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Info className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold">О приложении</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Версия</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <a 
                href="https://mentalbalans.com/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Документация
              </a>
              <a 
                href="https://mentalbalans.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Политика конфиденциальности
              </a>
              <a 
                href="https://mentalbalans.com/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Условия использования
              </a>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
