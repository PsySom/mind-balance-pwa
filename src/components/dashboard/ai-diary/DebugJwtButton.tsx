import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function DebugJwtButton() {
  const { toast } = useToast();

  const handleCopyJwt = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast({
          title: "❌ Ошибка",
          description: "Не удалось получить сессию",
          variant: "destructive"
        });
        return;
      }

      const accessToken = session.access_token;
      const userId = session.user.id;

      // Формат PowerShell
      const powershellCommand = `$JWT = "${accessToken}"\n$USER_ID = "${userId}"`;

      // Копируем в буфер
      await navigator.clipboard.writeText(powershellCommand);

      // Выводим в консоль для резервной копии
      console.log('=== JWT DEBUG INFO ===');
      console.log(powershellCommand);
      console.log('======================');

      toast({
        title: "✅ JWT скопирован в буфер!",
        description: "Также выведен в консоль"
      });
    } catch (error) {
      console.error('Error copying JWT:', error);
      toast({
        title: "❌ Ошибка",
        description: "Не удалось скопировать JWT",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handleCopyJwt}
      className="fixed top-4 right-4 z-[9999] bg-green-600 hover:bg-green-700 text-white shadow-lg"
      size="sm"
    >
      <span className="mr-2">📋</span>
      Copy JWT
    </Button>
  );
}
