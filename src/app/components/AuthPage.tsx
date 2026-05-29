import { Chrome } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { PrismLogo } from './PrismLogo';
import type { Profile } from './types';

interface AuthPageProps {
  onGoogleAuth: (profile: Profile) => void;
}

export function AuthPage({ onGoogleAuth }: AuthPageProps) {
  const handleGoogleAuth = async () => {
    try {
      const profile = await signInWithGoogle();
      onGoogleAuth(profile);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      console.error('Google sign-in failed:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center text-center">
      <div className="w-full max-w-md flex flex-col items-center">
        <PrismLogo className="h-28 w-28 mb-5" />
        <h1 className="text-5xl font-bold text-foreground leading-tight">Prism</h1>
        <p className="text-muted-foreground mt-3 mb-10">
          Refracting your finances with clarity.
        </p>

        <div className="w-full bg-card border border-border rounded-3xl p-6 shadow-sm">
          <button
            onClick={handleGoogleAuth}
            className="w-full bg-foreground text-background rounded-2xl p-4 font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
