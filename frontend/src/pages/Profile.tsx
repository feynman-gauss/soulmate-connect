import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Edit2,
  MapPin,
  GraduationCap,
  Briefcase,
  Heart,
  Camera,
  Crown,
  Shield,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.profiles.getMyProfile();
        setUser({
          ...data,
          // Default fallbacks for missing fields until backend provides them
          location: data.location?.city || 'Location not set',
          education: data.education || 'Education not set',
          occupation: data.occupation || 'Occupation not set',
          about: data.about || 'Tell us about yourself...',
          interests: data.interests || [],
          photos: data.photos?.length ? data.photos : ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
          profileCompletion: data.profile_completion || 30
        });
      } catch (error) {
        toast.error('Failed to load profile');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-display text-xl font-bold gradient-text">My Profile</span>
          <Button variant="glass" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-3xl overflow-hidden mb-6">
          {/* Cover & Photo */}
          <div className="relative h-32 bg-gradient-primary">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <img
                  src={user.photos[0]}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-background"
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-2 ring-background">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="pt-14 pb-6 px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-display font-bold">{user.name}, {user.age}</h2>
              {user.verified && (
                <Shield className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-bold text-primary">{user.profileCompletion}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all"
              style={{ width: `${user.profileCompletion}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {user.profileCompletion < 100
              ? "Complete your profile to get more matches!"
              : "Great job! Your profile is complete."}
          </p>
        </div>

        {/* Premium Banner */}
        {!user.premium && (
          <div className="glass-card rounded-2xl p-4 mb-6 gradient-border overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Upgrade to Premium</h3>
                <p className="text-xs text-muted-foreground">Get unlimited likes & super likes</p>
              </div>
              <Button variant="gradient" size="sm">
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* About */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">About Me</h3>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{user.about}</p>
        </div>

        {/* Details */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <h3 className="font-semibold mb-4">Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-sm">{user.education}</span>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-sm">{user.occupation}</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm">{user.religion || 'Religion not set'}</span>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Interests</h3>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.interests.length > 0 ? (
              user.interests.map((interest: string) => (
                <Badge key={interest} className="bg-primary/20 text-primary border-0">
                  {interest}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No interests added yet</span>
            )}
          </div>
        </div>

        {/* Logout */}
        <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </AppLayout>
  );
}
