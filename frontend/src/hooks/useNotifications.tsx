import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { api } from '@/services/api';

interface Notification {
    id: string;
    type: 'new_match' | 'super_like' | 'new_like' | 'new_message' | 'match_request' | 'request_sent' | 'super_interest' | 'request_accepted';
    title: string;
    message: string;
    data?: any;
    read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    toastQueue: Notification[];
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return ctx;
}

const POLL_INTERVAL = 15000; // 15 seconds

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [toastQueue, setToastQueue] = useState<Notification[]>([]);
    const knownIdsRef = useRef<Set<string>>(new Set());
    const isFirstFetchRef = useRef(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.notifications.getAll();
            const notifs: Notification[] = data || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);

            // Detect new notifications (not on first load)
            if (!isFirstFetchRef.current) {
                const newNotifs = notifs.filter(n => !knownIdsRef.current.has(n.id) && !n.read);
                if (newNotifs.length > 0) {
                    setToastQueue(prev => [...prev, ...newNotifs]);
                }
            }

            // Update known IDs
            knownIdsRef.current = new Set(notifs.map(n => n.id));
            isFirstFetchRef.current = false;
        } catch (error) {
            // If not authenticated, just silently fail
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await api.notifications.getUnreadCount();
            const count = data?.count || 0;
            setUnreadCount(count);
        } catch (error) {
            // Silently fail
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.notifications.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.notifications.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToastQueue(prev => prev.filter(n => n.id !== id));
    }, []);

    // Poll for notifications
    useEffect(() => {
        // Only poll if user is logged in
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Initial fetch
        fetchNotifications();

        // Set up polling
        const interval = setInterval(() => {
            fetchNotifications();
        }, POLL_INTERVAL);

        // Also refetch on visibility change
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchNotifications();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [fetchNotifications]);

    // Auto-dismiss toasts after 6 seconds
    useEffect(() => {
        if (toastQueue.length === 0) return;
        const timer = setTimeout(() => {
            setToastQueue(prev => prev.slice(1));
        }, 6000);
        return () => clearTimeout(timer);
    }, [toastQueue]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                toastQueue,
                fetchNotifications,
                fetchUnreadCount,
                markAsRead,
                markAllAsRead,
                dismissToast,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
