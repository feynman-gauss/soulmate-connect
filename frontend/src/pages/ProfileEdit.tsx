import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';

// Tyagi Gotra options
const GOTRA_OPTIONS = [
    'Bhardwaj', 'Kashyap', 'Vashishtha', 'Gautam', 'Sandilya',
    'Kaushik', 'Parashar', 'Atri', 'Agastya', 'Jamadagni',
    'Garg', 'Vatsa', 'Shandilya', 'Mudgal', 'Other'
];

// Sub-caste options
const SUB_CASTE_OPTIONS = [
    'Barhsena Tyagi', 'Chaumukha Tyagi', 'Dauhar Tyagi',
    'Baliyan Tyagi', 'Khaga Tyagi', 'Other'
];

// Manglik options
const MANGLIK_OPTIONS = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' },
    { value: 'partial', label: 'Partial (Anshik)' },
    { value: 'dont_know', label: "Don't Know" },
];

export default function ProfileEdit() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        // Basic Details
        about: '',
        education: '',
        occupation: '',
        height: '',
        religion: 'Hindu',
        // Location
        city: '',
        state: '',
        // Community Details (Tyagi)
        gotra: '',
        subCaste: '',
        nativeVillage: '',
        manglikStatus: '',
        // Family Details
        fatherName: '',
        fatherOccupation: '',
        motherName: '',
        motherOccupation: '',
        familyType: '',
        // Interests
        interests: [] as string[],
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const data = await api.profiles.getMyProfile();
                setFormData({
                    about: data.about || '',
                    education: data.education || '',
                    occupation: data.occupation || '',
                    height: data.height || '',
                    religion: data.religion || 'Hindu',
                    city: data.location?.city || '',
                    state: data.location?.state || '',
                    gotra: data.gotra || '',
                    subCaste: data.sub_caste || '',
                    nativeVillage: data.native_village || '',
                    manglikStatus: data.manglik_status || '',
                    fatherName: data.family_details?.father_name || '',
                    fatherOccupation: data.family_details?.father_occupation || '',
                    motherName: data.family_details?.mother_name || '',
                    motherOccupation: data.family_details?.mother_occupation || '',
                    familyType: data.family_details?.family_type || '',
                    interests: data.interests || [],
                });
            } catch (error) {
                toast.error('Failed to load profile');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.profiles.updateProfile({
                about: formData.about || undefined,
                education: formData.education || undefined,
                occupation: formData.occupation || undefined,
                height: formData.height || undefined,
                religion: formData.religion || undefined,
                location: formData.city ? {
                    city: formData.city,
                    state: formData.state || '',
                    country: 'India'
                } : undefined,
                gotra: formData.gotra || undefined,
                sub_caste: formData.subCaste || undefined,
                native_village: formData.nativeVillage || undefined,
                manglik_status: formData.manglikStatus || undefined,
                family_details: (formData.fatherName || formData.motherName) ? {
                    father_name: formData.fatherName || undefined,
                    father_occupation: formData.fatherOccupation || undefined,
                    mother_name: formData.motherName || undefined,
                    mother_occupation: formData.motherOccupation || undefined,
                    family_type: formData.familyType || undefined,
                } : undefined,
                interests: formData.interests.length > 0 ? formData.interests : undefined,
            });
            toast.success('Profile updated successfully!');
            navigate('/profile');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-20 glass-card border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/profile">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="font-display text-lg font-bold">Edit Profile</h1>
                </div>
                <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                </Button>
            </header>

            {/* Content */}
            <main className="relative z-10 px-4 py-6 space-y-6 pb-20">

                {/* About Section */}
                <div className="glass-card rounded-2xl p-4">
                    <h3 className="font-semibold mb-4">About Me</h3>
                    <Textarea
                        placeholder="Tell us about yourself, your interests, and what you're looking for..."
                        value={formData.about}
                        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                        className="glass-card border-white/10 min-h-[100px]"
                    />
                </div>

                {/* Basic Details */}
                <div className="glass-card rounded-2xl p-4">
                    <h3 className="font-semibold mb-4">Basic Details</h3>
                    <div className="space-y-4">
                        <div>
                            <Label>Education</Label>
                            <Input
                                placeholder="e.g., B.Tech, MBA, MBBS"
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div>
                            <Label>Occupation</Label>
                            <Input
                                placeholder="e.g., Software Engineer, Doctor"
                                value={formData.occupation}
                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Height</Label>
                                <Input
                                    placeholder="e.g., 5'8"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="glass-card border-white/10 h-12 rounded-xl mt-1"
                                />
                            </div>
                            <div>
                                <Label>Religion</Label>
                                <Input
                                    value={formData.religion}
                                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                                    className="glass-card border-white/10 h-12 rounded-xl mt-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="glass-card rounded-2xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Current Location
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>City</Label>
                            <Input
                                placeholder="e.g., Delhi, Noida"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div>
                            <Label>State</Label>
                            <Input
                                placeholder="e.g., Delhi, UP"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Tyagi Community Details */}
                <div className="glass-card rounded-2xl p-4">
                    <h3 className="font-semibold mb-4 text-primary">Tyagi Community Details</h3>
                    <div className="space-y-4">
                        <div>
                            <Label>Gotra *</Label>
                            <Select
                                value={formData.gotra}
                                onValueChange={(value) => setFormData({ ...formData, gotra: value })}
                            >
                                <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl mt-1">
                                    <SelectValue placeholder="Select your Gotra" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GOTRA_OPTIONS.map((gotra) => (
                                        <SelectItem key={gotra} value={gotra}>
                                            {gotra}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">Important for matching</p>
                        </div>

                        <div>
                            <Label>Sub-caste</Label>
                            <Select
                                value={formData.subCaste}
                                onValueChange={(value) => setFormData({ ...formData, subCaste: value })}
                            >
                                <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl mt-1">
                                    <SelectValue placeholder="Select sub-caste" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUB_CASTE_OPTIONS.map((caste) => (
                                        <SelectItem key={caste} value={caste}>
                                            {caste}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Native Village (Gaon)</Label>
                            <Input
                                placeholder="e.g., Baraut, Baghpat"
                                value={formData.nativeVillage}
                                onChange={(e) => setFormData({ ...formData, nativeVillage: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Your ancestral village</p>
                        </div>

                        <div>
                            <Label>Manglik Status</Label>
                            <Select
                                value={formData.manglikStatus}
                                onValueChange={(value) => setFormData({ ...formData, manglikStatus: value })}
                            >
                                <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl mt-1">
                                    <SelectValue placeholder="Select Manglik status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MANGLIK_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Family Details */}
                <div className="glass-card rounded-2xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Family Background
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <Label>Father's Name</Label>
                            <Input
                                placeholder="Enter father's name"
                                value={formData.fatherName}
                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div>
                            <Label>Father's Occupation</Label>
                            <Input
                                placeholder="e.g., Farmer, Business, Govt. Service"
                                value={formData.fatherOccupation}
                                onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div>
                            <Label>Mother's Name</Label>
                            <Input
                                placeholder="Enter mother's name"
                                value={formData.motherName}
                                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div>
                            <Label>Mother's Occupation</Label>
                            <Input
                                placeholder="e.g., Homemaker, Teacher"
                                value={formData.motherOccupation}
                                onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                                className="glass-card border-white/10 h-12 rounded-xl mt-1"
                            />
                        </div>
                        <div>
                            <Label>Family Type</Label>
                            <Select
                                value={formData.familyType}
                                onValueChange={(value) => setFormData({ ...formData, familyType: value })}
                            >
                                <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl mt-1">
                                    <SelectValue placeholder="Select family type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="joint">Joint Family</SelectItem>
                                    <SelectItem value="nuclear">Nuclear Family</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Interests */}
                <div className="glass-card rounded-2xl p-4">
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <p className="text-xs text-muted-foreground mb-4">Select your interests to help find better matches</p>
                    <div className="flex flex-wrap gap-2">
                        {['Reading', 'Cooking', 'Travel', 'Music', 'Fitness', 'Yoga', 'Photography', 'Dancing', 'Movies', 'Cricket', 'Art', 'Spirituality', 'Gaming', 'Gardening', 'Hiking', 'Swimming', 'Writing', 'Fashion', 'Technology', 'Social Work'].map((interest) => {
                            const isSelected = formData.interests.includes(interest);
                            return (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            interests: isSelected
                                                ? prev.interests.filter(i => i !== interest)
                                                : [...prev.interests, interest]
                                        }));
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                            ? 'bg-primary text-white shadow-md'
                                            : 'glass-card border border-white/10 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                        }`}
                                >
                                    {interest}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
