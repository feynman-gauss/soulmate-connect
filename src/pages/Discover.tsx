import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { mockProfiles } from '@/data/mockProfiles';
import { Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles] = useState(mockProfiles);

  const handleLike = () => {
    toast.success('Liked! 💕', {
      description: `You liked ${profiles[currentIndex].name}'s profile`,
    });
    nextProfile();
  };

  const handlePass = () => {
    nextProfile();
  };

  const handleSuperLike = () => {
    toast.success('Super Like sent! ⭐', {
      description: `${profiles[currentIndex].name} will be notified!`,
    });
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
            <Button variant="glass" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>

        {/* Profile Cards */}
        <div className="flex items-center justify-center min-h-[70vh]">
          {profiles[currentIndex] && (
            <ProfileCard
              key={profiles[currentIndex].id}
              profile={profiles[currentIndex]}
              onLike={handleLike}
              onPass={handlePass}
              onSuperLike={handleSuperLike}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
