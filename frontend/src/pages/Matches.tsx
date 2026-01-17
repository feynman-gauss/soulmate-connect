import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Heart, Crown, Check, X, Send, Inbox, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { getProfilePhoto } from '@/utils/profileUtils';
import { formatDate } from '@/utils/timeUtils';
import { Button } from '@/components/ui/button';

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesData, receivedData, sentData] = await Promise.all([
          api.matches.getAll(),
          api.matches.getReceivedRequests().catch(() => []),
          api.matches.getSentRequests().catch(() => [])
        ]);
        setMatches(matchesData);
        setReceivedRequests(receivedData);
        setSentRequests(sentData);
      } catch (error) {
        toast.error('Failed to load matches');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await api.matches.acceptRequest(requestId);
      toast.success('Request accepted! 💕');
      // Refresh data
      const [matchesData, receivedData] = await Promise.all([
        api.matches.getAll(),
        api.matches.getReceivedRequests()
      ]);
      setMatches(matchesData);
      setReceivedRequests(receivedData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await api.matches.rejectRequest(requestId);
      toast.success('Request declined');
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">Matches</span>
        </div>

        {/* Interest Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Interest Requests
            </h3>
            {/* Tab Toggle */}
            <div className="flex gap-1 bg-muted/30 rounded-full p-1">
              <button
                onClick={() => setActiveTab('received')}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeTab === 'received'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Inbox className="w-3 h-3 inline mr-1" />
                Received ({receivedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeTab === 'sent'
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Send className="w-3 h-3 inline mr-1" />
                Sent ({sentRequests.filter(r => r.status === 'pending').length})
              </button>
            </div>
          </div>

          {activeTab === 'received' && (
            <>
              {receivedRequests.length > 0 ? (
                <div className="space-y-3">
                  {receivedRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="glass-card rounded-2xl p-4 flex items-center gap-4"
                    >
                      <Link to={`/profile/${request.profile.id}`}>
                        <img
                          src={getProfilePhoto(request.profile.photos, request.profile.gender)}
                          alt={request.profile.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {request.profile.name}, {request.profile.age}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {request.profile.occupation || request.profile.location?.city || 'is interested in you'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-10 h-10 rounded-full border-red-500/30 hover:bg-red-500/20 hover:text-red-500"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="gradient"
                          className="w-10 h-10 rounded-full"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">No pending interest requests</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'sent' && (
            <>
              {sentRequests.length > 0 ? (
                <div className="space-y-3">
                  {sentRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="glass-card rounded-2xl p-4 flex items-center gap-4"
                    >
                      <Link to={`/profile/${request.profile.id}`}>
                        <img
                          src={getProfilePhoto(request.profile.photos, request.profile.gender)}
                          alt={request.profile.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {request.profile.name}, {request.profile.age}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {request.profile.occupation || request.profile.location?.city}
                        </p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        request.status === 'pending' && "bg-yellow-500/20 text-yellow-600",
                        request.status === 'accepted' && "bg-green-500/20 text-green-600",
                        request.status === 'rejected' && "bg-red-500/20 text-red-600"
                      )}>
                        {request.status === 'pending' && 'Awaiting'}
                        {request.status === 'accepted' && 'Accepted'}
                        {request.status === 'rejected' && 'Declined'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">You haven't sent any interest requests yet</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Matches Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
            Your Matches ({matches.length})
          </h3>
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  to={`/chat/${match.id}`}
                  className="block"
                >
                  <div className="glass-card-hover rounded-2xl p-4 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={getProfilePhoto(match.profile.photos, match.profile.gender)}
                        alt={match.profile.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
                      />
                      {match.profile.verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{match.profile.name}</h4>
                        {match.profile.premium && (
                          <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {match.last_message ? match.last_message.content : 'Start the conversation!'}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Matched on {formatDate(match.matched_at)}
                      </p>
                    </div>
                    {match.unread_count > 0 && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{match.unread_count}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 rounded-xl text-center">
              <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">You haven't matched with anyone yet.</p>
              <Link to="/discover">
                <p className="text-primary text-sm font-semibold mt-2 hover:underline">Go to Discover</p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
