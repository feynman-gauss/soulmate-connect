import { useState, useEffect, useRef } from 'react';
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
  LogOut,
  Users,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { getProfilePhoto } from '@/utils/profileUtils';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.profiles.getMyProfile();
        setUser({
          ...data,
          // Default fallbacks for missing fields until backend provides them
          location: data.location?.city || 'Location not set',
          education: data.education || 'Add education',
          occupation: data.occupation || 'Add occupation',
          about: data.about || 'Tell us about yourself...',
          interests: data.interests || [],
          photos: data.photos?.length ? data.photos : [],
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const result = await api.profiles.uploadPhoto(file);

      // Update user state with the updated photos array from server
      setUser((prev: any) => ({
        ...prev,
        photos: result.photos || [...(prev.photos || []), result.photo_url],
      }));

      // Update localStorage user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.photos = result.photos || [...(userData.photos || []), result.photo_url];
        localStorage.setItem('user', JSON.stringify(userData));
      }

      toast.success('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Photo upload failed:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  // Check if profile is missing important community details
  const missingCommunityDetails = !user.gotra || !user.native_village;
  const missingFamilyDetails = !user.family_details?.father_name;

  return (
    <AppLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-display text-xl font-bold gradient-text">My Profile</span>
          <Link to="/profile/edit">
            <Button variant="glass" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-3xl overflow-hidden mb-6">
          {/* Cover & Photo */}
          <div className="relative h-32 bg-gradient-primary">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <img
                  src={getProfilePhoto(user.photos, user.gender)}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-background"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-2 ring-background disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
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
            {/* Show Gotra prominently */}
            {user.gotra && (
              <p className="text-primary font-medium text-sm">{user.gotra} Gotra</p>
            )}
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="w-4 h-4" />
              <span>{user.native_village || user.location}</span>
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
          {user.profileCompletion < 100 && (
            <Link to="/profile/edit">
              <p className="text-xs text-primary mt-2 hover:underline cursor-pointer">
                Complete your profile to get more matches! →
              </p>
            </Link>
          )}
        </div>

        {/* Missing Details Alert */}
        {(missingCommunityDetails || missingFamilyDetails) && (
          <div className="glass-card rounded-2xl p-4 mb-6 border border-primary/30 bg-primary/5">
            <h3 className="font-semibold text-sm mb-2">Complete Your Profile</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Adding more details helps families find compatible matches
            </p>
            <div className="space-y-2">
              {missingCommunityDetails && (
                <Link to="/profile/edit" className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <span>+ Add Gotra & Native Village</span>
                </Link>
              )}
              {missingFamilyDetails && (
                <Link to="/profile/edit" className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <span>+ Add Family Details</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Tyagi Community Details */}
        {(user.gotra || user.sub_caste || user.native_village || user.manglik_status) && (
          <div className="glass-card rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Community Details</h3>
              <Link to="/profile/edit">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {user.gotra && (
                <div>
                  <span className="text-muted-foreground text-xs">Gotra</span>
                  <p className="font-medium">{user.gotra}</p>
                </div>
              )}
              {user.sub_caste && (
                <div>
                  <span className="text-muted-foreground text-xs">Sub-caste</span>
                  <p className="font-medium">{user.sub_caste}</p>
                </div>
              )}
              {user.native_village && (
                <div>
                  <span className="text-muted-foreground text-xs">Native Village</span>
                  <p className="font-medium">{user.native_village}</p>
                </div>
              )}
              {user.manglik_status && (
                <div>
                  <span className="text-muted-foreground text-xs">Manglik</span>
                  <p className="font-medium capitalize">{user.manglik_status}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Family Details */}
        {user.family_details && (user.family_details.father_name || user.family_details.mother_name) && (
          <div className="glass-card rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Family Background
              </h3>
              <Link to="/profile/edit">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2 text-sm">
              {user.family_details.father_name && (
                <div>
                  <span className="text-muted-foreground">Father: </span>
                  <span>{user.family_details.father_name}</span>
                  {user.family_details.father_occupation && (
                    <span className="text-muted-foreground"> ({user.family_details.father_occupation})</span>
                  )}
                </div>
              )}
              {user.family_details.mother_name && (
                <div>
                  <span className="text-muted-foreground">Mother: </span>
                  <span>{user.family_details.mother_name}</span>
                  {user.family_details.mother_occupation && (
                    <span className="text-muted-foreground"> ({user.family_details.mother_occupation})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Banner */}
        {!user.premium && (
          <div className="glass-card rounded-2xl p-4 mb-6 gradient-border overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Upgrade to Premium</h3>
                <p className="text-xs text-muted-foreground">Get unlimited likes & priority visibility</p>
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
            <Link to="/profile/edit">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{user.about}</p>
        </div>

        {/* Details */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Details</h3>
            <Link to="/profile/edit">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
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
              <span className="text-sm">{user.religion || 'Hindu'}</span>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Interests</h3>
            <Link to="/profile/edit">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.interests.length > 0 ? (
              user.interests.map((interest: string) => (
                <Badge key={interest} className="bg-primary/20 text-primary border-0">
                  {interest}
                </Badge>
              ))
            ) : (
              <Link to="/profile/edit" className="text-sm text-primary hover:underline">
                + Add interests
              </Link>
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
