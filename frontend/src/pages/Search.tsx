import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Search as SearchIcon, MapPin, GraduationCap, Loader2, SlidersHorizontal, X, IndianRupee, Ruler, Briefcase, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { getProfilePhoto } from '@/utils/profileUtils';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// Filter options
const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];
const EDUCATION_OPTIONS = ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Diploma', 'Other'];
const PROFESSION_OPTIONS = ['Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Government Job', 'Private Job', 'Lawyer', 'CA/Accountant', 'Other'];
const MARITAL_STATUS_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Separated'];

interface SearchFilters {
    minAge: number;
    maxAge: number;
    minHeight: number;
    maxHeight: number;
    minSalary: number;
    maxSalary: number;
    gender: string;
    religion: string;
    education: string;
    profession: string;
    maritalStatus: string;
    location: string;
}

const defaultFilters: SearchFilters = {
    minAge: 21,
    maxAge: 40,
    minHeight: 150,
    maxHeight: 200,
    minSalary: 0,
    maxSalary: 100,
    gender: '',
    religion: '',
    education: '',
    profession: '',
    maritalStatus: '',
    location: '',
};

export default function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    useEffect(() => {
        // Count active filters
        let count = 0;
        if (filters.gender) count++;
        if (filters.religion) count++;
        if (filters.education) count++;
        if (filters.profession) count++;
        if (filters.maritalStatus) count++;
        if (filters.location) count++;
        if (filters.minAge !== 21 || filters.maxAge !== 40) count++;
        if (filters.minHeight !== 150 || filters.maxHeight !== 200) count++;
        if (filters.minSalary !== 0 || filters.maxSalary !== 100) count++;
        setActiveFiltersCount(count);
    }, [filters]);

    useEffect(() => {
        const searchProfiles = async () => {
            try {
                setIsLoading(true);
                const data = await api.discover.getProfiles(50);
                setProfiles(data || []);
            } catch (error) {
                console.error('Failed to fetch profiles:', error);
                setProfiles([]);
            } finally {
                setIsLoading(false);
            }
        };

        searchProfiles();
    }, []);

    const filteredProfiles = profiles.filter(profile => {
        const query = searchQuery.toLowerCase();

        // Text search
        const matchesQuery = !query ||
            profile.name?.toLowerCase().includes(query) ||
            profile.gotra?.toLowerCase().includes(query) ||
            profile.native_village?.toLowerCase().includes(query) ||
            profile.location?.city?.toLowerCase().includes(query) ||
            profile.occupation?.toLowerCase().includes(query) ||
            profile.education?.toLowerCase().includes(query);

        // Age filter
        const age = profile.age || 25;
        const matchesAge = age >= filters.minAge && age <= filters.maxAge;

        // Height filter (convert height string like "5'6\"" to cm if needed)
        let heightCm = 170; // default
        if (profile.height) {
            if (typeof profile.height === 'number') {
                heightCm = profile.height;
            } else if (typeof profile.height === 'string') {
                // Try to parse feet/inches format
                const match = profile.height.match(/(\d+)'(\d+)/);
                if (match) {
                    heightCm = parseInt(match[1]) * 30.48 + parseInt(match[2]) * 2.54;
                } else {
                    heightCm = parseInt(profile.height) || 170;
                }
            }
        }
        const matchesHeight = heightCm >= filters.minHeight && heightCm <= filters.maxHeight;

        // Salary filter (in lakhs)
        let salaryLakhs = 5; // default
        if (profile.salary || profile.income) {
            const salaryStr = profile.salary || profile.income;
            if (typeof salaryStr === 'number') {
                salaryLakhs = salaryStr;
            } else if (typeof salaryStr === 'string') {
                const match = salaryStr.match(/(\d+)/);
                if (match) salaryLakhs = parseInt(match[1]);
            }
        }
        const matchesSalary = salaryLakhs >= filters.minSalary && salaryLakhs <= filters.maxSalary;

        // Gender filter
        const matchesGender = !filters.gender || profile.gender === filters.gender;

        // Religion filter
        const matchesReligion = !filters.religion ||
            profile.religion?.toLowerCase() === filters.religion.toLowerCase();

        // Education filter
        const matchesEducation = !filters.education ||
            profile.education?.toLowerCase().includes(filters.education.toLowerCase());

        // Profession filter
        const matchesProfession = !filters.profession ||
            profile.occupation?.toLowerCase().includes(filters.profession.toLowerCase());

        // Marital status filter
        const matchesMaritalStatus = !filters.maritalStatus ||
            profile.marital_status?.toLowerCase() === filters.maritalStatus.toLowerCase();

        // Location filter
        const matchesLocation = !filters.location ||
            profile.location?.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
            profile.location?.state?.toLowerCase().includes(filters.location.toLowerCase()) ||
            profile.native_village?.toLowerCase().includes(filters.location.toLowerCase());

        return matchesQuery && matchesAge && matchesHeight && matchesSalary &&
            matchesGender && matchesReligion && matchesEducation &&
            matchesProfession && matchesMaritalStatus && matchesLocation;
    });

    const clearFilters = () => {
        setFilters(defaultFilters);
    };

    const formatHeight = (cm: number): string => {
        const feet = Math.floor(cm / 30.48);
        const inches = Math.round((cm % 30.48) / 2.54);
        return `${feet}'${inches}"`;
    };

    return (
        <AppLayout>
            <div className="px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <SearchIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display text-xl font-bold gradient-text">Search</span>
                    </div>

                    {/* Filter Button */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="glass" size="sm" className="relative">
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Search Filters</SheetTitle>
                                <SheetDescription>
                                    Refine your search to find the perfect match
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6 mt-6">
                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <div className="flex gap-2">
                                        {['', 'male', 'female'].map((g) => (
                                            <Button
                                                key={g}
                                                variant={filters.gender === g ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setFilters({ ...filters, gender: g })}
                                                className="flex-1"
                                            >
                                                {g === '' ? 'Any' : g === 'male' ? 'Male' : 'Female'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Age Range */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Heart className="w-4 h-4" />
                                        Age Range: {filters.minAge} - {filters.maxAge} years
                                    </Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            min={18}
                                            max={100}
                                            value={filters.minAge}
                                            onChange={(e) => setFilters({ ...filters, minAge: parseInt(e.target.value) || 18 })}
                                            className="w-20"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="number"
                                            min={18}
                                            max={100}
                                            value={filters.maxAge}
                                            onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) || 100 })}
                                            className="w-20"
                                        />
                                    </div>
                                </div>

                                {/* Height Range */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Ruler className="w-4 h-4" />
                                        Height: {formatHeight(filters.minHeight)} - {formatHeight(filters.maxHeight)}
                                    </Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            min={120}
                                            max={220}
                                            value={filters.minHeight}
                                            onChange={(e) => setFilters({ ...filters, minHeight: parseInt(e.target.value) || 150 })}
                                            className="w-20"
                                            placeholder="cm"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="number"
                                            min={120}
                                            max={220}
                                            value={filters.maxHeight}
                                            onChange={(e) => setFilters({ ...filters, maxHeight: parseInt(e.target.value) || 200 })}
                                            className="w-20"
                                            placeholder="cm"
                                        />
                                    </div>
                                </div>

                                {/* Salary Range */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4" />
                                        Annual Income: ₹{filters.minSalary}L - ₹{filters.maxSalary}L
                                    </Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={200}
                                            value={filters.minSalary}
                                            onChange={(e) => setFilters({ ...filters, minSalary: parseInt(e.target.value) || 0 })}
                                            className="w-20"
                                            placeholder="Lakhs"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={200}
                                            value={filters.maxSalary}
                                            onChange={(e) => setFilters({ ...filters, maxSalary: parseInt(e.target.value) || 100 })}
                                            className="w-20"
                                            placeholder="Lakhs"
                                        />
                                    </div>
                                </div>

                                {/* Religion */}
                                <div className="space-y-2">
                                    <Label>Religion</Label>
                                    <Select
                                        value={filters.religion}
                                        onValueChange={(value) => setFilters({ ...filters, religion: value === 'any' ? '' : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Religion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any Religion</SelectItem>
                                            {RELIGION_OPTIONS.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Education */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Education
                                    </Label>
                                    <Select
                                        value={filters.education}
                                        onValueChange={(value) => setFilters({ ...filters, education: value === 'any' ? '' : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Education" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any Education</SelectItem>
                                            {EDUCATION_OPTIONS.map((e) => (
                                                <SelectItem key={e} value={e}>{e}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Profession */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Profession
                                    </Label>
                                    <Select
                                        value={filters.profession}
                                        onValueChange={(value) => setFilters({ ...filters, profession: value === 'any' ? '' : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Profession" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any Profession</SelectItem>
                                            {PROFESSION_OPTIONS.map((p) => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Marital Status */}
                                <div className="space-y-2">
                                    <Label>Marital Status</Label>
                                    <Select
                                        value={filters.maritalStatus}
                                        onValueChange={(value) => setFilters({ ...filters, maritalStatus: value === 'any' ? '' : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any Status</SelectItem>
                                            {MARITAL_STATUS_OPTIONS.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Location
                                    </Label>
                                    <Input
                                        placeholder="City, State or Village"
                                        value={filters.location}
                                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                                        <X className="w-4 h-4 mr-2" />
                                        Clear All
                                    </Button>
                                    <SheetClose asChild>
                                        <Button variant="gradient" className="flex-1">
                                            Apply Filters
                                        </Button>
                                    </SheetClose>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, location, profession..."
                        className="pl-12 glass-card border-white/10 rounded-xl h-12"
                    />
                </div>

                {/* Active Filters Display */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {filters.gender && (
                            <Badge variant="secondary" className="gap-1">
                                {filters.gender === 'male' ? 'Male' : 'Female'}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, gender: '' })} />
                            </Badge>
                        )}
                        {(filters.minAge !== 21 || filters.maxAge !== 40) && (
                            <Badge variant="secondary" className="gap-1">
                                Age: {filters.minAge}-{filters.maxAge}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, minAge: 21, maxAge: 40 })} />
                            </Badge>
                        )}
                        {(filters.minHeight !== 150 || filters.maxHeight !== 200) && (
                            <Badge variant="secondary" className="gap-1">
                                Height: {formatHeight(filters.minHeight)}-{formatHeight(filters.maxHeight)}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, minHeight: 150, maxHeight: 200 })} />
                            </Badge>
                        )}
                        {(filters.minSalary !== 0 || filters.maxSalary !== 100) && (
                            <Badge variant="secondary" className="gap-1">
                                ₹{filters.minSalary}L-₹{filters.maxSalary}L
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, minSalary: 0, maxSalary: 100 })} />
                            </Badge>
                        )}
                        {filters.religion && (
                            <Badge variant="secondary" className="gap-1">
                                {filters.religion}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, religion: '' })} />
                            </Badge>
                        )}
                        {filters.education && (
                            <Badge variant="secondary" className="gap-1">
                                {filters.education}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, education: '' })} />
                            </Badge>
                        )}
                        {filters.profession && (
                            <Badge variant="secondary" className="gap-1">
                                {filters.profession}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, profession: '' })} />
                            </Badge>
                        )}
                        {filters.maritalStatus && (
                            <Badge variant="secondary" className="gap-1">
                                {filters.maritalStatus}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, maritalStatus: '' })} />
                            </Badge>
                        )}
                        {filters.location && (
                            <Badge variant="secondary" className="gap-1">
                                📍 {filters.location}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, location: '' })} />
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                            Clear all
                        </Button>
                    </div>
                )}

                {/* Results Count */}
                {!isLoading && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? 's' : ''} found
                    </p>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Results Grid */}
                {!isLoading && filteredProfiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {filteredProfiles.map((profile) => (
                            <Link key={profile.id} to={`/profile/${profile.id}`} className="block">
                                <div className="glass-card-hover rounded-xl overflow-hidden">
                                    <div className="aspect-[4/5] relative">
                                        <img
                                            src={getProfilePhoto(profile.photos, profile.gender)}
                                            alt={profile.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-1.5">
                                            <h3 className="text-white font-medium text-xs truncate">
                                                {profile.name?.split(' ')[0]}, {profile.age}
                                            </h3>
                                            <div className="flex items-center gap-0.5 text-white/70 text-[10px] mt-0.5">
                                                <MapPin className="w-2.5 h-2.5" />
                                                <span className="truncate">{profile.location?.city || 'India'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredProfiles.length === 0 && (
                    <div className="text-center py-20">
                        <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No profiles found</h3>
                        <p className="text-muted-foreground text-sm">
                            {searchQuery || activeFiltersCount > 0
                                ? 'Try adjusting your search or filters'
                                : 'Start searching to find your perfect match!'
                            }
                        </p>
                        {(searchQuery || activeFiltersCount > 0) && (
                            <Button
                                variant="glass"
                                className="mt-4"
                                onClick={() => { setSearchQuery(''); clearFilters(); }}
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
