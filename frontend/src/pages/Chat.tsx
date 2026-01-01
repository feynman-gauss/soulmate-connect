import { AppLayout } from '@/components/layout/AppLayout';
import { mockMatches } from '@/data/mockProfiles';
import { MessageCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useState, useEffect } from 'react';

export default function Chat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const data = await api.chat.getConversations();
        if (data && data.length > 0) {
          setConversations(data);
        } else {
          // Fallback to mock for demo
          setConversations(mockMatches);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations(mockMatches);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  return (
    <AppLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">Messages</span>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-12 glass-card border-white/10 rounded-xl h-12"
          />
        </div>

        {/* Conversations */}
        <div className="space-y-3">
          {conversations.map((match) => (
            <Link
              key={match.id}
              to={`/chat/${match.profile?.id || '1'}`}
              className="block"
            >
              <div className="glass-card-hover rounded-2xl p-4 flex items-center gap-4">
                <div className="relative">
                  <img
                    src={match.profile?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'}
                    alt={match.profile?.name || 'User'}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-foreground truncate">
                      {match.profile?.name || 'User'}
                    </h4>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {match.lastMessage || 'Start a conversation'}
                  </p>
                </div>
                {match.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{match.unreadCount}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State if no matches */}
        {conversations.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Match with someone to start a conversation
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
