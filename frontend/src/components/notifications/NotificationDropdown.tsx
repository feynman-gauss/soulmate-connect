import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, Star, User, Check, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatTimeAgo } from '@/utils/timeUtils';

interface Notification {
    id: string;
    type: 'new_match' | 'super_like' | 'new_like' | 'new_message' | 'match_request' | 'request_sent' | 'super_interest' | 'request_accepted';
    title: string;
    message: string;
    data?: any;
    read: boolean;
    created_at: string;
}

const getNotificationIcon = (type: string) => {
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

const getNotificationLink = (notification: Notification): string => {
    switch (notification.type) {
        case 'new_match':
        case 'request_accepted':
            return '/matches';
        case 'match_request':
        case 'super_interest':
            return '/matches';
        case 'request_sent':
            return '/matches';
        case 'super_like':
        case 'new_like':
            return notification.data?.user_id ? `/profile/${notification.data.user_id}` : '/matches';
        case 'new_message':
            return notification.data?.match_id ? `/chat/${notification.data.match_id}` : '/chat';
        default:
            return '/matches';
    }
};

export function NotificationDropdown() {
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleOpen}>
            <SheetTrigger asChild>
                <Button variant="glass" size="icon" className="rounded-full relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse-slow">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="flex flex-row items-center justify-between">
                    <SheetTitle>Notifications</SheetTitle>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                            <Check className="w-4 h-4 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </SheetHeader>

                <div className="mt-6 space-y-2">
                    {isLoading && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}

                    {!isLoading && notifications.length === 0 && (
                        <div className="text-center py-10">
                            <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No notifications yet</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                                Swipe on profiles to get started!
                            </p>
                        </div>
                    )}

                    {!isLoading && notifications.map((notification) => (
                        <Link
                            key={notification.id}
                            to={getNotificationLink(notification)}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50",
                                    !notification.read && "bg-primary/5 border-l-2 border-primary"
                                )}
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm",
                                        !notification.read && "font-semibold"
                                    )}>
                                        {notification.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        {formatTimeAgo(notification.created_at)}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}
