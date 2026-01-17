import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Shield, Users, MapPin } from 'lucide-react';
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
            <span className="font-display text-xl font-bold gradient-text">Tyagi Rishta</span>
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
              <span className="text-sm text-muted-foreground">Tyagi Community Matrimony</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your
              <br />
              <span className="gradient-text">Perfect Match</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
              Trusted matrimonial platform exclusively for the Tyagi community. Connect with verified profiles from families you can trust.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                  Register Free
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="glass" size="lg" className="w-full sm:w-auto">
                  Browse Profiles
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
              <h3 className="font-semibold mb-2">Gotra Verified</h3>
              <p className="text-sm text-muted-foreground">Every profile shows Gotra for proper matching as per tradition</p>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Western UP & NCR</h3>
              <p className="text-sm text-muted-foreground">Connect with Tyagi families from your native regions</p>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Family Profiles</h3>
              <p className="text-sm text-muted-foreground">Complete family background for transparent matching</p>
            </div>
          </div>

          {/* Trust Section */}
          <div className="mt-16 glass-card p-6 rounded-2xl max-w-md animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-muted-foreground mb-3">🙏 Built by Tyagis, for Tyagis</p>
            <div className="flex items-center justify-center gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-xs text-muted-foreground">Registered</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-xs text-muted-foreground">Villages</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-xs text-muted-foreground">Gotras</div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Tyagi Rishta. Made with ❤️ for our community.</p>
        </footer>
      </div>
    </div>
  );
}
