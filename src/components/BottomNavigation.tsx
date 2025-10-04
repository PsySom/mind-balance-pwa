import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Activity, Calendar, History, BarChart3 } from 'lucide-react';

const items = [
  { title: 'Дневник', url: '/dashboard?tab=journal', icon: BookOpen },
  { title: 'Трекеры', url: '/dashboard?tab=trackers', icon: Activity },
  { title: 'Планировщик', url: '/dashboard?tab=planner', icon: Calendar },
  { title: 'История', url: '/dashboard?tab=history', icon: History },
  { title: 'Аналитика', url: '/dashboard?tab=analytics', icon: BarChart3 },
];

export function BottomNavigation() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'journal';

  const isActive = (url: string) => {
    return url.includes(`tab=${currentTab}`);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50"
      role="navigation"
      aria-label="Основная навигация"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.url)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={item.title}
            aria-current={isActive(item.url) ? 'page' : undefined}
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
