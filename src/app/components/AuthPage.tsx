import { Chrome, ShieldCheck } from 'lucide-react';
import type { Profile } from './types';
import { signInWithGoogle } from '../firebase';

interface AuthPageProps {
  onGoogleAuth: (profile: Profile) => void;
}

export function AuthPage({ onGoogleAuth }: AuthPageProps) {
  const handleGoogleAuth = async () => {
    const profile = await signInWithGoogle();
    onGoogleAuth(profile);
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight">Prism</h1>
          <p className="text-muted-foreground mt-2">
            Sign in or create an account with Google through Firebase.
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <button
            onClick={handleGoogleAuth}
            className="w-full bg-foreground text-background rounded-2xl p-4 font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Login and Sign Up use the same Firebase Google provider flow.
          </p>
        </div>
      </div>
    </div>
  );
}
