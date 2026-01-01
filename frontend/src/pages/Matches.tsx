import { AppLayout } from '@/components/layout/AppLayout';
import { mockMatches, mockProfiles } from '@/data/mockProfiles';
import { Heart, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Matches() {
  const newLikes = mockProfiles.slice(0, 3);

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

        {/* New Likes Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
            New Likes ({newLikes.length})
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {newLikes.map((profile) => (
              <Link 
                key={profile.id} 
                to={`/profile/${profile.id}`}
                className="flex-shrink-0"
              >
                <div className="relative w-24 h-32 rounded-2xl overflow-hidden glass-card-hover">
                  <img
                    src={profile.photos[0]}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium truncate">{profile.name.split(' ')[0]}</p>
                    <p className="text-white/70 text-[10px]">{profile.age}</p>
                  </div>
                  {profile.premium && (
                    <div className="absolute top-2 right-2 bg-gradient-primary p-1 rounded-full">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {/* Blur card for premium */}
            <div className="flex-shrink-0 relative w-24 h-32 rounded-2xl overflow-hidden glass-card">
              <div className="absolute inset-0 bg-gradient-primary/20 backdrop-blur-md flex items-center justify-center">
                <div className="text-center p-2">
                  <Crown className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-foreground font-medium">+12 more</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matches Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
            Your Matches ({mockMatches.length})
          </h3>
          <div className="space-y-4">
            {mockMatches.map((match) => (
              <Link
                key={match.id}
                to={`/chat/${match.profile.id}`}
                className="block"
              >
                <div className="glass-card-hover rounded-2xl p-4 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={match.profile.photos[0]}
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
                      {match.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Matched on {new Date(match.matchedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {match.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{match.unreadCount}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
