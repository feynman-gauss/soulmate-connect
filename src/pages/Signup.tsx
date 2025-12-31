import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    lookingFor: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    toast.success('Account created! Welcome to Soulmate');
    navigate('/discover');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 -left-40 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="p-6 relative z-10 flex items-center justify-between">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 w-8 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="w-5" />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm">
          {step === 1 && (
            <>
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" fill="white" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">Start your journey to find love</p>
              </div>

              {/* Form Step 1 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
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
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
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
                  <Label htmlFor="password">Password</Label>
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
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="gradient" className="w-full" size="lg">
                  Continue
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold mb-2">About You</h1>
                <p className="text-muted-foreground">Help us find your perfect match</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label>I am a</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    className="flex gap-4"
                  >
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${
                        formData.gender === 'male' ? 'ring-2 ring-primary bg-primary/10' : ''
                      }`}>
                        <RadioGroupItem value="male" className="sr-only" />
                        <span className="text-2xl mb-2 block">👨</span>
                        <span className="font-medium">Man</span>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${
                        formData.gender === 'female' ? 'ring-2 ring-primary bg-primary/10' : ''
                      }`}>
                        <RadioGroupItem value="female" className="sr-only" />
                        <span className="text-2xl mb-2 block">👩</span>
                        <span className="font-medium">Woman</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Looking for</Label>
                  <RadioGroup
                    value={formData.lookingFor}
                    onValueChange={(value) => setFormData({ ...formData, lookingFor: value })}
                    className="flex gap-4"
                  >
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${
                        formData.lookingFor === 'woman' ? 'ring-2 ring-primary bg-primary/10' : ''
                      }`}>
                        <RadioGroupItem value="woman" className="sr-only" />
                        <span className="text-2xl mb-2 block">👩</span>
                        <span className="font-medium">Woman</span>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <div className={`glass-card rounded-xl p-4 text-center transition-all ${
                        formData.lookingFor === 'man' ? 'ring-2 ring-primary bg-primary/10' : ''
                      }`}>
                        <RadioGroupItem value="man" className="sr-only" />
                        <span className="text-2xl mb-2 block">👨</span>
                        <span className="font-medium">Man</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <Button type="submit" variant="gradient" className="w-full" size="lg">
                  Create Account
                </Button>
              </form>
            </>
          )}

          {/* Sign In Link */}
          <p className="text-center mt-8 text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
