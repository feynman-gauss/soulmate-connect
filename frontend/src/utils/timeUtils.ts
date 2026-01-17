/**
 * Utility functions for handling time/dates throughout the app
 * Backend stores times in UTC, frontend needs to handle timezone conversion
 */

/**
 * Parse a UTC datetime string from the backend
 * The backend uses datetime.utcnow() which returns UTC time without timezone info
 * We need to treat it as UTC when parsing
 */
export const parseUTCDate = (dateString: string): Date => {
    if (!dateString) return new Date();

    // If the string doesn't have timezone info, append 'Z' to treat as UTC
    let utcString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        utcString = dateString + 'Z';
    }

    return new Date(utcString);
};

/**
 * Format a relative time string like "5m ago", "2h ago", "3d ago"
 */
export const formatTimeAgo = (dateString: string): string => {
    const date = parseUTCDate(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Just now'; // Handle future dates gracefully
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

/**
 * Format a datetime for display (in user's local timezone)
 */
export const formatDateTime = (dateString: string): string => {
    const date = parseUTCDate(dateString);
    return date.toLocaleString();
};

/**
 * Format just the date part (in user's local timezone)
 */
export const formatDate = (dateString: string): string => {
    const date = parseUTCDate(dateString);
    return date.toLocaleDateString();
};

/**
 * Format just the time part (in user's local timezone)
 */
export const formatTime = (dateString: string): string => {
    const date = parseUTCDate(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format time for chat messages (e.g., "10:30 AM")
 */
export const formatMessageTime = (dateString: string): string => {
    const date = parseUTCDate(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
