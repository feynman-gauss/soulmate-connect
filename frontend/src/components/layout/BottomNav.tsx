import { Home, Search, Heart, MessageCircle, User, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { icon: Home, label: 'Home', path: '/discover' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Heart, label: 'Matches', path: '/matches' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  let unreadCount = 0;

  // Safely try to use notification context (it may not be available on unauthenticated pages)
  try {
    const notifs = useNotifications();
    unreadCount = notifs.unreadCount;
  } catch {
    // Not inside provider, that's fine
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === '/matches' && unreadCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300 relative",
                isActive && "bg-primary/20"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "scale-110"
                )} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] flex items-center justify-center text-white font-bold animate-pulse-slow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
