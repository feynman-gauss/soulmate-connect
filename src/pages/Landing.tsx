import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">Soulmate</span>
          </div>
          <Link to="/login">
            <Button variant="glass" size="sm">
              Sign In
            </Button>
          </Link>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Find Your Perfect Match</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Where Love
              <br />
              <span className="gradient-text">Finds Home</span>
            </h1>
            
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
              Join millions of singles finding meaningful connections. Your soulmate is just a swipe away.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="glass" size="lg" className="w-full sm:w-auto">
                  Explore Profiles
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Profiles</h3>
              <p className="text-sm text-muted-foreground">Every profile is manually verified for your safety</p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Smart Matching</h3>
              <p className="text-sm text-muted-foreground">AI-powered compatibility based on your preferences</p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">5M+ Members</h3>
              <p className="text-sm text-muted-foreground">Join our growing community of singles</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Soulmate. Made with ❤️ for finding love.</p>
        </footer>
      </div>
    </div>
  );
}
