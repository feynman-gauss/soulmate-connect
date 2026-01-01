import { UserProfile } from '@/types/profile';
import { Heart, X, Star, MapPin, GraduationCap, Briefcase, Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProfileCardProps {
  profile: UserProfile;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  className?: string;
}

export function ProfileCard({ profile, onLike, onPass, onSuperLike, className }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePhotoTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRightSide = x > rect.width / 2;
    
    if (isRightSide && currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    } else if (!isRightSide && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  return (
    <div className={cn(
      "relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden glass-card-hover",
      className
    )}>
      {/* Photo Section */}
      <div 
        className="relative aspect-[3/4] cursor-pointer"
        onClick={handlePhotoTap}
      >
        <img
          src={profile.photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
        
        {/* Photo indicators */}
        <div className="absolute top-4 left-4 right-4 flex gap-1">
          {profile.photos.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
              )}
            />
          ))}
        </div>

        {/* Premium & Verified badges */}
        <div className="absolute top-12 right-4 flex flex-col gap-2">
          {profile.premium && (
            <div className="bg-gradient-primary p-2 rounded-full">
              <Crown className="w-4 h-4 text-white" />
            </div>
          )}
          {profile.verified && (
            <div className="bg-blue-500 p-2 rounded-full">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {profile.name}, {profile.age}
              </h2>
              <div className="flex items-center gap-2 text-white/80 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="glass-card p-2 rounded-full"
            >
              <span className="text-white text-lg">{isExpanded ? '−' : '+'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-6 space-y-4 animate-slide-up">
          {/* Quick Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="glass-card border-white/10">
              <GraduationCap className="w-3 h-3 mr-1" />
              {profile.education}
            </Badge>
            <Badge variant="secondary" className="glass-card border-white/10">
              <Briefcase className="w-3 h-3 mr-1" />
              {profile.occupation}
            </Badge>
            <Badge variant="secondary" className="glass-card border-white/10">
              {profile.height}
            </Badge>
            <Badge variant="secondary" className="glass-card border-white/10">
              {profile.religion}
            </Badge>
          </div>

          {/* About */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {profile.about}
          </p>

          {/* Interests */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground/80">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} className="bg-primary/20 text-primary border-0">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6 pt-0 flex items-center justify-center gap-4">
        <Button
          variant="icon"
          size="icon"
          onClick={onPass}
          className="w-14 h-14 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all hover:scale-110"
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          variant="gradient"
          size="icon"
          onClick={onSuperLike}
          className="w-12 h-12 rounded-full"
        >
          <Star className="w-5 h-5" />
        </Button>
        
        <Button
          variant="icon"
          size="icon"
          onClick={onLike}
          className="w-14 h-14 rounded-full hover:bg-primary/20 hover:text-primary transition-all hover:scale-110"
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
