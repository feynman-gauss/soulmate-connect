import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Phone, MapPin, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

// Tyagi Gotra options
const GOTRA_OPTIONS = [
  'Bhardwaj', 'Kashyap', 'Vashishtha', 'Gautam', 'Sandilya',
  'Kaushik', 'Parashar', 'Atri', 'Agastya', 'Jamadagni',
  'Garg', 'Vatsa', 'Shandilya', 'Mudgal', 'Other'
];

// Manglik options
const MANGLIK_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
  { value: 'partial', label: 'Partial (Anshik)' },
  { value: 'dont_know', label: "Don't Know" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'male',
    lookingFor: 'woman',
    dateOfBirth: '',
    gotra: '',
    subCaste: '',
    nativeVillage: '',
    manglikStatus: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const calculateAge = (dob: string): number => {
    if (!dob) return 25;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async (skipOptional: boolean = false) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await api.auth.register({
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        gender: formData.gender,
        looking_for: formData.lookingFor,
        age: calculateAge(formData.dateOfBirth),
        gotra: skipOptional ? undefined : (formData.gotra || undefined),
        sub_caste: skipOptional ? undefined : (formData.subCaste || undefined),
        native_village: skipOptional ? undefined : (formData.nativeVillage || undefined),
        date_of_birth: formData.dateOfBirth || undefined,
        manglik_status: skipOptional ? undefined : (formData.manglikStatus || undefined),
      });
      toast.success('Account created! Welcome to Tyagi Rishta');
      navigate('/discover');
    } catch (error: any) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
      setErrorMsg('');
      return;
    }
    await handleRegister(false);
  };

  const handleSkipOptional = async () => {
    await handleRegister(true);
  };

  const renderStepIndicator = () => (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`h-1 rounded-full transition-colors ${s <= step ? 'bg-primary w-8' : 'bg-muted w-6'
            } ${s > 2 ? 'opacity-50' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 -left-40 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <header className="p-6 relative z-10 flex items-center justify-between">
        <button onClick={() => {
          if (step > 1) {
            setStep(step - 1);
            setErrorMsg('');
          } else {
            navigate('/');
          }
        }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        {renderStepIndicator()}
        <div className="w-5" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 overflow-y-auto py-4">
        <div className="w-full max-w-sm">

          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" fill="white" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Join Tyagi Rishta</h1>
                <p className="text-muted-foreground text-sm">Find your perfect match within the community</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-12 glass-card border-white/10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-12 glass-card border-white/10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-12 glass-card border-white/10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-12 pr-12 glass-card border-white/10 h-12 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground ml-1">At least 8 characters with a number and letter</p>
                </div>

                <Button type="submit" variant="gradient" className="w-full" size="lg">Continue</Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-bold mb-2">Personal Details</h1>
                <p className="text-muted-foreground text-sm">Tell us about yourself</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label>I am a *</Label>
                  <RadioGroup value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${formData.gender === 'male' ? 'ring-2 ring-primary bg-primary/10' : ''}`}>
                        <RadioGroupItem value="male" className="sr-only" />
                        <span className="text-2xl mb-2 block">👨</span>
                        <span className="font-medium">Man</span>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${formData.gender === 'female' ? 'ring-2 ring-primary bg-primary/10' : ''}`}>
                        <RadioGroupItem value="female" className="sr-only" />
                        <span className="text-2xl mb-2 block">👩</span>
                        <span className="font-medium">Woman</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Looking for *</Label>
                  <RadioGroup value={formData.lookingFor} onValueChange={(value) => setFormData({ ...formData, lookingFor: value })} className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${formData.lookingFor === 'woman' ? 'ring-2 ring-primary bg-primary/10' : ''}`}>
                        <RadioGroupItem value="woman" className="sr-only" />
                        <span className="text-2xl mb-2 block">👩</span>
                        <span className="font-medium">Bride</span>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${formData.lookingFor === 'man' ? 'ring-2 ring-primary bg-primary/10' : ''}`}>
                        <RadioGroupItem value="man" className="sr-only" />
                        <span className="text-2xl mb-2 block">👨</span>
                        <span className="font-medium">Groom</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full pl-12 justify-start text-left font-normal glass-card border-white/10 h-12 rounded-xl",
                          !formData.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        {formData.dateOfBirth ? (
                          format(new Date(formData.dateOfBirth), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: date ? format(date, "yyyy-MM-dd") : ''
                          })
                        }
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button type="submit" variant="gradient" className="w-full" size="lg">Continue</Button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-bold mb-2">Community Details</h1>
                <p className="text-muted-foreground text-sm">Your Tyagi community identity (optional)</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gotra">Gotra</Label>
                  <Select value={formData.gotra} onValueChange={(value) => setFormData({ ...formData, gotra: value })}>
                    <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Select your Gotra" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOTRA_OPTIONS.map((gotra) => (
                        <SelectItem key={gotra} value={gotra}>{gotra}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Important for matching - same gotra avoided</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nativeVillage">Native Village (Gaon)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nativeVillage"
                      placeholder="e.g., Baraut, Baghpat"
                      value={formData.nativeVillage}
                      onChange={(e) => setFormData({ ...formData, nativeVillage: e.target.value })}
                      className="pl-12 glass-card border-white/10 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manglik">Manglik Status</Label>
                  <Select value={formData.manglikStatus} onValueChange={(value) => setFormData({ ...formData, manglikStatus: value })}>
                    <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Select Manglik status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MANGLIK_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="glass" className="flex-1" size="lg" onClick={handleSkipOptional} disabled={isLoading}>
                    Fill Later
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1" size="lg">Continue</Button>
                </div>
              </form>
            </>
          )}

          {step === 4 && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Family Background</h1>
                <p className="text-muted-foreground text-sm">Help families connect (optional)</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    placeholder="Enter father's name"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="glass-card border-white/10 h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherOccupation">Father's Occupation</Label>
                  <Input
                    id="fatherOccupation"
                    placeholder="e.g., Farmer, Business, Govt. Service"
                    value={formData.fatherOccupation}
                    onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                    className="glass-card border-white/10 h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input
                    id="motherName"
                    placeholder="Enter mother's name"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="glass-card border-white/10 h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherOccupation">Mother's Occupation</Label>
                  <Input
                    id="motherOccupation"
                    placeholder="e.g., Homemaker, Teacher"
                    value={formData.motherOccupation}
                    onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                    className="glass-card border-white/10 h-12 rounded-xl"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="glass" className="flex-1" size="lg" onClick={handleSkipOptional} disabled={isLoading}>
                    Skip & Finish
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1" size="lg" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </>
          )}

          {errorMsg && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center animate-in fade-in slide-in-from-bottom-2">
              {errorMsg}
            </div>
          )}

          <p className="text-center mt-6 text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
