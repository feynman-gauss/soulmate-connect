// API Configuration and Service
// Dynamically determine API URL based on environment and current hostname
const getApiBaseUrl = (): string => {
    // If explicitly set via environment variable, use that
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // In production or when accessing from other devices, use the same hostname/port
    const { hostname, protocol, port } = window.location;

    // If we're on port 8000, we're likely talking to the backend directly in dev
    if (port === '8000') {
        return `${protocol}//${hostname}:8000/api/v1`;
    }

    // If we're on port 5173 (standard Vite dev port), we likely want to hit 8000
    if (port === '5173') {
        return `${protocol}//${hostname}:8000/api/v1`;
    }

    // Otherwise (e.g., when served via Nginx on port 80/8080), use relative URL
    return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('access_token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || 'Request failed');
    }
    return response.json();
};

// API Service
export const api = {
    // Authentication
    auth: {
        register: async (data: {
            email: string;
            name: string;
            phone: string;
            age: number;
            gender: string;
            password: string;
            looking_for?: string;
            // Tyagi Community Specific Fields
            gotra?: string;
            sub_caste?: string;
            native_village?: string;
            date_of_birth?: string;
            manglik_status?: string;
        }) => {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await handleResponse(response);

            // Store tokens
            if (result.access_token) {
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('refresh_token', result.refresh_token);
                localStorage.setItem('user', JSON.stringify(result.user));
            }

            return result;
        },

        login: async (email: string, password: string) => {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await handleResponse(response);

            // Store tokens
            if (result.access_token) {
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('refresh_token', result.refresh_token);
                localStorage.setItem('user', JSON.stringify(result.user));
            }

            return result;
        },

        logout: () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        },

        getCurrentUser: async () => {
            const token = getAuthToken();
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },

    // Profiles
    profiles: {
        getMyProfile: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profiles/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        updateProfile: async (data: any) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profiles/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },

        getUserProfile: async (userId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        uploadPhoto: async (file: File) => {
            const token = getAuthToken();
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/profiles/photos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            return handleResponse(response);
        },

        deletePhoto: async (photoIndex: number) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profiles/photos/${photoIndex}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },

    // Discovery
    discover: {
        getProfiles: async (limit: number = 20) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/discover?limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        swipe: async (targetUserId: string, action: 'like' | 'pass' | 'super_like') => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/discover/swipes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ target_user_id: targetUserId, action }),
            });
            return handleResponse(response);
        },

        getReceivedLikes: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/discover/likes/received`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },

    // Matches
    matches: {
        getAll: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        getMatch: async (matchId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        unmatch: async (matchId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        // Match Requests
        getReceivedRequests: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches/requests`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        getSentRequests: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches/requests/sent`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        acceptRequest: async (requestId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches/requests/${requestId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        rejectRequest: async (requestId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/matches/requests/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },

    // Chat
    chat: {
        getConversations: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        getMessages: async (matchId: string, limit: number = 50, skip: number = 0) => {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/chat/${matchId}/messages?limit=${limit}&skip=${skip}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            return handleResponse(response);
        },

        sendMessage: async (matchId: string, content: string, messageType: string = 'text') => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/chat/${matchId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, message_type: messageType }),
            });
            return handleResponse(response);
        },

        markAsRead: async (matchId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/chat/${matchId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },

    // Search
    search: {
        searchProfiles: async (params: {
            query?: string;
            gender?: string;
            min_age?: number;
            max_age?: number;
            religion?: string;
            education?: string;
            location?: string;
            limit?: number;
        }) => {
            const token = getAuthToken();
            const queryString = new URLSearchParams(
                Object.entries(params)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, String(v)])
            ).toString();

            const response = await fetch(`${API_BASE_URL}/search?${queryString}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        getSuggestions: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/search/suggestions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },

    // Notifications
    notifications: {
        getAll: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        markAsRead: async (notificationId: string) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        markAllAsRead: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },

        getUnreadCount: async () => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return handleResponse(response);
        },
    },
};

// WebSocket for real-time chat
export const createChatWebSocket = (onMessage: (data: any) => void) => {
    const token = getAuthToken();
    if (!token) throw new Error('No auth token');

    let wsUrl;
    if (API_BASE_URL.startsWith('http')) {
        wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api/v1', '');
    } else {
        // Handle relative URL (e.g. /api/v1)
        const { protocol, host } = window.location;
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${host}`;
    }
    
    const ws = new WebSocket(`${wsUrl}/ws/chat?token=${token}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
    };

    return ws;
};

export default api;
