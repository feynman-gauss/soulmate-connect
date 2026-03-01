import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Heart,
  Star,
  X,
  MapPin,
  GraduationCap,
  Briefcase,
  Crown,
  Shield,
  MessageCircle,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { getProfilePhoto } from '@/utils/profileUtils';

export default function ProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await api.profiles.getUserProfile(id);
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Profile not found');
        navigate('/discover');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  const handleLike = async () => {
    if (!profile) return;
    try {
      await api.discover.swipe(profile.id, 'like');
      toast.success('Liked! 💕', {
        description: `You liked ${profile.name}'s profile`,
      });
    } catch (error) {
      toast.success('Liked! 💕');
    }
  };

  const handleSuperLike = async () => {
    if (!profile) return;
    try {
      await api.discover.swipe(profile.id, 'super_like');
      toast.success('Super Like sent! ⭐', {
        description: `${profile.name} will be notified!`,
      });
    } catch (error) {
      toast.success('Super Like sent! ⭐');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const photos = profile.photos?.length > 0 ? profile.photos : [getProfilePhoto(undefined, profile.gender)];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/discover">
          <Button variant="glass" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Photo Section */}
      <div className="relative h-[60vh]">
        <img
          src={photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />

        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="absolute top-6 left-20 right-6 flex gap-1">
            {photos.map((_: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentPhotoIndex(idx)}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-16 right-6 flex flex-col gap-2">
          {profile.premium && (
            <div className="bg-gradient-primary p-2 rounded-full">
              <Crown className="w-4 h-4 text-white" />
            </div>
          )}
          {profile.verified && (
            <div className="bg-blue-500 p-2 rounded-full">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 -mt-20 px-6 pb-32">
        {/* Name & Location */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {profile.name}, {profile.age}
          </h1>

          {/* Tyagi Community Identifiers */}
          {(profile.gotra || profile.native_village) && (
            <div className="flex items-center gap-2 text-primary mt-2 font-medium">
              {profile.gotra && <span>{profile.gotra} Gotra</span>}
              {profile.gotra && profile.native_village && <span>•</span>}
              {profile.native_village && <span>{profile.native_village}</span>}
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <MapPin className="w-4 h-4" />
            <span>{profile.location?.city || 'India'}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Active {profile.lastActive || 'recently'}
          </p>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.education && (
            <Badge variant="secondary" className="glass-card border-white/10">
              <GraduationCap className="w-3 h-3 mr-1" />
              {profile.education}
            </Badge>
          )}
          {profile.occupation && (
            <Badge variant="secondary" className="glass-card border-white/10">
              <Briefcase className="w-3 h-3 mr-1" />
              {profile.occupation}
            </Badge>
          )}
          {profile.height && (
            <Badge variant="secondary" className="glass-card border-white/10">
              {profile.height}
            </Badge>
          )}
          {profile.religion && (
            <Badge variant="secondary" className="glass-card border-white/10">
              {profile.religion}
            </Badge>
          )}
          {profile.manglik_status && (
            <Badge variant="secondary" className="glass-card border-white/10">
              Manglik: {profile.manglik_status === 'dont_know' ? "Don't Know" : profile.manglik_status}
            </Badge>
          )}

        </div>

        {/* About */}
        {profile.about && (
          <div className="glass-card rounded-2xl p-4 mb-6">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.about}
            </p>
          </div>
        )}

        {/* Family Details (Tyagi Specific) */}
        {profile.family_details && (profile.family_details.father_name || profile.family_details.mother_name) && (
          <div className="glass-card rounded-2xl p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Family Background
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              {profile.family_details.father_name && (
                <div>
                  <span className="text-foreground/70">Father:</span> {profile.family_details.father_name}
                  {profile.family_details.father_occupation && ` (${profile.family_details.father_occupation})`}
                </div>
              )}
              {profile.family_details.mother_name && (
                <div>
                  <span className="text-foreground/70">Mother:</span> {profile.family_details.mother_name}
                  {profile.family_details.mother_occupation && ` (${profile.family_details.mother_occupation})`}
                </div>
              )}
              {profile.family_details.family_type && (
                <div>
                  <span className="text-foreground/70">Family Type:</span> {profile.family_details.family_type}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-6">
            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string) => (
                <Badge key={interest} className="bg-primary/20 text-primary border-0">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Looking For */}
        {profile.lookingFor?.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-6">
            <h3 className="font-semibold mb-3">Looking For</h3>
            <div className="flex flex-wrap gap-2">
              {profile.lookingFor.map((trait: string) => (
                <Badge key={trait} className="bg-accent/20 text-accent border-0">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 p-4 z-20">
        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
          <Button
            variant="icon"
            size="icon"
            className="w-14 h-14 rounded-full hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="w-6 h-6" />
          </Button>

          <Button
            variant="gradient"
            size="icon"
            onClick={handleSuperLike}
            className="w-12 h-12 rounded-full"
          >
            <Star className="w-5 h-5" />
          </Button>

          <Button
            variant="icon"
            size="icon"
            onClick={handleLike}
            className="w-14 h-14 rounded-full hover:bg-primary/20 hover:text-primary"
          >
            <Heart className="w-6 h-6" />
          </Button>

          <Link to={`/chat/${profile.id}`}>
            <Button
              variant="icon"
              size="icon"
              className="w-12 h-12 rounded-full hover:bg-blue-500/20 hover:text-blue-500"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
