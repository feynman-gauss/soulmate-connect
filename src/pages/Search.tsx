import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockProfiles } from '@/data/mockProfiles';
import { Search as SearchIcon, MapPin, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProfiles = mockProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <SearchIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">Search</span>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, location, profession..."
            className="pl-12 glass-card border-white/10 rounded-xl h-12"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {['Mumbai', 'Delhi', 'Doctor', 'Engineer', 'MBA'].map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="cursor-pointer glass-card hover:bg-primary/20 transition-colors whitespace-nowrap"
              onClick={() => setSearchQuery(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-4">
          {filteredProfiles.map((profile) => (
            <Link 
              key={profile.id} 
              to={`/profile/${profile.id}`}
              className="block"
            >
              <div className="glass-card-hover rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] relative">
                  <img
                    src={profile.photos[0]}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold">
                      {profile.name.split(' ')[0]}, {profile.age}
                    </h3>
                    <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{profile.location.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                      <GraduationCap className="w-3 h-3" />
                      <span className="truncate">{profile.education}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No profiles found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
