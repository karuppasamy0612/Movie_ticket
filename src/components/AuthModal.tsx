import { useState } from 'react';
import { Film, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthed: () => void;
};

type Mode = 'signin' | 'signup';

function AuthModal({ open, onClose, onAuthed }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      reset();
      onAuthed();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="auth-modal">
        <button className="modal-close" onClick={close} aria-label="Close" type="button">
          <X size={20} />
        </button>
        <div className="auth-modal-heading">
          <span className="brand">
            <span className="brand-mark"><Film size={17} strokeWidth={2.5} /></span>
            <span>LUMEN</span>
          </span>
          <p className="section-kicker">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
          <h2>{mode === 'signin' ? 'Sign in to book' : 'Join Lumen'}</h2>
          <p className="auth-subtitle">
            {mode === 'signin'
              ? 'Sign in to reserve your seats and view your bookings.'
              : 'Create an account to start booking tickets.'}
          </p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="button button-dark auth-submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" /> Please wait…
              </>
            ) : (
              <>{mode === 'signin' ? 'Sign in' : 'Create account'}</>
            )}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'signin' ? (
            <>New to Lumen? <button type="button" onClick={() => switchMode('signup')}>Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
