import { useNotifications } from '@/hooks/useNotifications';
import { Heart, Star, MessageCircle, Bell, X, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/utils/timeUtils';

const getToastIcon = (type: string) => {
    switch (type) {
        case 'new_match':
        case 'request_accepted':
            return <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />;
        case 'super_like':
        case 'super_interest':
            return <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />;
        case 'new_like':
        case 'match_request':
            return <Heart className="w-5 h-5 text-primary" />;
        case 'request_sent':
            return <Users className="w-5 h-5 text-green-500" />;
        case 'new_message':
            return <MessageCircle className="w-5 h-5 text-blue-500" />;
        default:
            return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
};

const getNotificationLink = (type: string, data?: any): string => {
    switch (type) {
        case 'new_match':
        case 'request_accepted':
        case 'match_request':
        case 'super_interest':
        case 'request_sent':
            return '/matches';
        case 'super_like':
        case 'new_like':
            return data?.user_id ? `/profile/${data.user_id}` : '/matches';
        case 'new_message':
            return data?.match_id ? `/chat/${data.match_id}` : '/chat';
        default:
            return '/matches';
    }
};

export function NotificationToastContainer() {
    const { toastQueue, dismissToast, markAsRead } = useNotifications();

    if (toastQueue.length === 0) return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-3 px-4 pointer-events-none">
            {toastQueue.slice(0, 3).map((notification, index) => (
                <Link
                    key={notification.id}
                    to={getNotificationLink(notification.type, notification.data)}
                    onClick={() => {
                        markAsRead(notification.id);
                        dismissToast(notification.id);
                    }}
                    className="pointer-events-auto w-full max-w-md"
                >
                    <div
                        className={cn(
                            "relative w-full rounded-2xl border border-white/10 p-4",
                            "bg-background/80 backdrop-blur-xl shadow-2xl",
                            "flex items-start gap-3",
                            "animate-slide-up",
                            "transition-all duration-300 hover:border-primary/30 hover:bg-background/90",
                            "cursor-pointer"
                        )}
                        style={{
                            animationDelay: `${index * 100}ms`,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(217, 70, 119, 0.08)',
                        }}
                    >
                        {/* Gradient accent line at top */}
                        <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                            {getToastIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">
                                {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1">
                                {formatTimeAgo(notification.created_at)}
                            </p>
                        </div>

                        {/* Dismiss */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dismissToast(notification.id);
                            }}
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </Link>
            ))}
        </div>
    );
}
