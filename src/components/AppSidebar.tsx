import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { BookOpen, Activity, Calendar, History, BarChart3, Settings } from 'lucide-react';

const items = [
  { title: 'Дневник', url: '/dashboard?tab=journal', icon: BookOpen },
  { title: 'Трекеры', url: '/dashboard?tab=trackers', icon: Activity },
  { title: 'Планировщик', url: '/dashboard?tab=planner', icon: Calendar },
  { title: 'История', url: '/dashboard?tab=history', icon: History },
  { title: 'Аналитика', url: '/dashboard?tab=analytics', icon: BarChart3 },
  { title: 'Настройки', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'journal';
  const isCollapsed = state === 'collapsed';

  const isActive = (url: string) => {
    if (url === '/settings') {
      return location.pathname === '/settings';
    }
    return url.includes(`tab=${currentTab}`);
  };

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: navIsActive }) =>
                        isActive(item.url)
                          ? 'bg-muted text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }
                      aria-label={item.title}
                      aria-current={isActive(item.url) ? 'page' : undefined}
                    >
                      <item.icon className="w-4 h-4" aria-hidden="true" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
