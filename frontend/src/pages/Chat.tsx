import { AppLayout } from '@/components/layout/AppLayout';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useState, useEffect } from 'react';
import { getProfilePhoto } from '@/utils/profileUtils';
import { formatDate } from '@/utils/timeUtils';

export default function Chat() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        // Fetch matches - each match has a chat
        const matchesData = await api.matches.getAll();
        if (matchesData && matchesData.length > 0) {
          setMatches(matchesData);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Filter matches based on search
  const filteredMatches = matches.filter(match =>
    match.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-12 glass-card border-white/10 rounded-xl h-12"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Conversations from Matches */}
        {!isLoading && filteredMatches.length > 0 && (
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <Link
                key={match.id}
                to={`/chat/${match.id}`}
                className="block"
              >
                <div className="glass-card-hover rounded-2xl p-4 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={getProfilePhoto(match.profile?.photos, match.profile?.gender)}
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
                      <span className="text-xs text-muted-foreground">
                        {match.last_message?.created_at
                          ? formatDate(match.last_message.created_at)
                          : 'New'}
                      </span>
                    </div>
                    {/* Show Gotra for Tyagi community */}
                    {match.profile?.gotra && (
                      <p className="text-xs text-primary/80 mb-0.5">{match.profile.gotra} Gotra</p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {match.last_message?.content || 'Start the conversation! 👋'}
                    </p>
                  </div>
                  {match.unread_count > 0 && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{match.unread_count}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State if no matches */}
        {!isLoading && filteredMatches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">
              {searchQuery ? 'No matches found' : 'No conversations yet'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {searchQuery
                ? 'Try a different search term'
                : 'Match with someone from the Discover page to start chatting!'
              }
            </p>
            {!searchQuery && (
              <Link to="/discover" className="mt-4 text-primary font-semibold hover:underline">
                Go to Discover →
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
