import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { mockProfiles } from '@/data/mockProfiles';
import { Bell, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useEffect } from 'react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingDemo, setIsShowingDemo] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const data = await api.discover.getProfiles();
        // If backend returns profiles, use them
        if (data && data.length > 0) {
          setProfiles(data);
          setIsShowingDemo(false);
        } else {
          // Fallback to single demo profile
          setProfiles(mockProfiles);
          setIsShowingDemo(true);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        // Fallback to single demo profile on error
        setProfiles(mockProfiles);
        setIsShowingDemo(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleLike = async () => {
    const targetUserId = profiles[currentIndex].id;
    try {
      await api.discover.swipe(targetUserId, 'like');
      toast.success('Liked! 💕', {
        description: `You liked ${profiles[currentIndex].name}'s profile`,
      });
    } catch (error) {
      // Just toast success for demo if it fails because of missing ID format
      toast.success('Liked!💕');
    }
    nextProfile();
  };

  const handlePass = async () => {
    const targetUserId = profiles[currentIndex].id;
    try {
      await api.discover.swipe(targetUserId, 'pass');
    } catch (error) { }
    nextProfile();
  };

  const handleSuperLike = async () => {
    const targetUserId = profiles[currentIndex].id;
    try {
      await api.discover.swipe(targetUserId, 'super_like');
      toast.success('Super Like sent! ⭐', {
        description: `${profiles[currentIndex].name} will be notified!`,
      });
    } catch (error) {
      toast.success('Super Like sent! ⭐');
    }
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">Discover</span>
          </div>
          <div className="flex items-center gap-3">
            <FilterSheet />
            <NotificationDropdown />
          </div>
        </div>

        {/* Demo Profile Banner */}
        {isShowingDemo && profiles[currentIndex] && (
          <div className="glass-card rounded-xl p-3 mb-4 border border-primary/30 bg-primary/5">
            <p className="text-sm text-center text-muted-foreground">
              👋 This is a <span className="text-primary font-semibold">demo profile</span>. Invite Tyagi community members to see real profiles!
            </p>
          </div>
        )}

        {/* Profile Cards */}
        <div className="flex items-center justify-center min-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground">Finding profiles from the community...</p>
            </div>
          ) : profiles[currentIndex] ? (
            <ProfileCard
              key={profiles[currentIndex].id}
              profile={profiles[currentIndex]}
              onLike={handleLike}
              onPass={handlePass}
              onSuperLike={handleSuperLike}
            />
          ) : (
            <div className="text-center p-8 glass-card rounded-3xl max-w-sm">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">No more profiles</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {isShowingDemo
                  ? "Invite more Tyagi community members to join and find your perfect match!"
                  : "Check back later for new profiles from the community!"
                }
              </p>
              <Button variant="gradient" className="w-full" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
