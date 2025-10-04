import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smile, Heart, AlertTriangle, Zap, CloudRain, XCircle, Flame, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmotionBadge from '@/components/EmotionBadge';

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Справка</h1>
        </div>

        {/* Трекеры */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Что такое трекеры состояния?</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-semibold">Настроение (Mood)</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                Общее эмоциональное состояние. Оцените, как вы себя чувствуете в моменте: от подавленного (1) до радостного (10).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <h3 className="font-semibold">Стресс (Stress)</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                Уровень напряжения и тревоги. Низкий уровень (1) = спокойствие, высокий (10) = сильное напряжение.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h3 className="font-semibold">Энергия (Energy)</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                Физическая и ментальная энергия. Оцените способность действовать: от истощения (1) до бодрости (10).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h3 className="font-semibold">Удовлетворенность процессом</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                Насколько вам нравится то, чем вы занимаетесь. Оцените качество самого опыта: от неприятного (1) до вдохновляющего (10).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <h3 className="font-semibold">Удовлетворенность результатом</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                Довольны ли вы результатами своей работы. Оцените итоги: от разочарования (1) до гордости (10).
              </p>
            </div>
          </div>
        </Card>

        {/* Модель эмоций Плутчика */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Модель эмоций Плутчика</h2>
          <p className="text-muted-foreground mb-4">
            Роберт Плутчик выделил 8 базовых эмоций, которые являются основой всех остальных чувств:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="joy" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Радость</h4>
                <p className="text-xs text-muted-foreground">Удовольствие, счастье, восторг</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="trust" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Доверие</h4>
                <p className="text-xs text-muted-foreground">Принятие, уверенность, безопасность</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="fear" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Страх</h4>
                <p className="text-xs text-muted-foreground">Тревога, беспокойство, ужас</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="surprise" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Удивление</h4>
                <p className="text-xs text-muted-foreground">Изумление, потрясение, шок</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="sadness" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Грусть</h4>
                <p className="text-xs text-muted-foreground">Печаль, уныние, меланхолия</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="disgust" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Отвращение</h4>
                <p className="text-xs text-muted-foreground">Неприятие, отторжение, презрение</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="anger" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Гнев</h4>
                <p className="text-xs text-muted-foreground">Злость, раздражение, ярость</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EmotionBadge emotion="anticipation" intensity="high" size="sm" />
              <div>
                <h4 className="font-semibold text-sm">Предвкушение</h4>
                <p className="text-xs text-muted-foreground">Ожидание, интерес, бдительность</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Когнитивные искажения */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Когнитивные искажения</h2>
          <p className="text-muted-foreground mb-4">
            Автоматические ошибки мышления, которые искажают восприятие реальности:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Катастрофизация</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Преувеличение негативных последствий. <br />
                <span className="italic">Пример: "Я опоздал на встречу, теперь меня точно уволят!"</span>
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Черно-белое мышление</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Видение ситуации в крайностях без полутонов. <br />
                <span className="italic">Пример: "Если я не идеален, значит я полный неудачник"</span>
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Сверхобобщение</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Вывод общих правил на основе единичных случаев. <br />
                <span className="italic">Пример: "Я провалил экзамен, я всегда все проваливаю"</span>
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Чтение мыслей</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Уверенность в знании чужих мыслей без подтверждения. <br />
                <span className="italic">Пример: "Он на меня не смотрит, значит я ему неинтересен"</span>
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Персонализация</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Принятие на себя ответственности за события, не зависящие от вас. <br />
                <span className="italic">Пример: "Коллега в плохом настроении, наверное я что-то не так сделал"</span>
              </p>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="frequency">
              <AccordionTrigger>Как часто заполнять трекеры?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Рекомендуется заполнять трекеры 1-2 раза в день: утром и вечером. Это поможет отследить динамику вашего состояния и выявить паттерны. Однако вы можете заполнять их чаще, если чувствуете значительные изменения в течение дня.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="storage">
              <AccordionTrigger>Сохраняются ли данные локально?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Нет, все ваши данные сохраняются в защищенной облачной базе данных Supabase. Это позволяет получить доступ к вашей истории с любого устройства. Ваши данные защищены и доступны только вам через вашу учетную запись.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="export">
              <AccordionTrigger>Можно ли экспортировать данные?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  В текущей версии функция экспорта находится в разработке. В будущем вы сможете экспортировать свои данные в форматах CSV и JSON для анализа в других приложениях или резервного копирования.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ai">
              <AccordionTrigger>Как AI анализирует записи?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground space-y-2">
                  <span className="block">AI использует современные языковые модели для анализа ваших записей в дневнике. Система:</span>
                  <span className="block">• Определяет основные эмоции по модели Плутчика</span>
                  <span className="block">• Выявляет когнитивные искажения в мышлении</span>
                  <span className="block">• Определяет ключевые темы и триггеры</span>
                  <span className="block">• Оценивает общий уровень настроения (1-10)</span>
                  <span className="block mt-2">Все анализы конфиденциальны и используются только для вашего личного понимания.</span>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy">
              <AccordionTrigger>Безопасны ли мои данные?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Да, ваши данные полностью защищены. Мы используем шифрование для передачи данных, безопасную аутентификацию и Row Level Security (RLS) в базе данных. Никто, кроме вас, не имеет доступа к вашим записям.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <div className="text-center text-sm text-muted-foreground pb-6">
          <p>Есть вопросы? Свяжитесь с поддержкой: support@psybalance.app</p>
        </div>
      </div>
    </div>
  );
}
