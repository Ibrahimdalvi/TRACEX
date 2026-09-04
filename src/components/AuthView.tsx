import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthViewProps {
  onAuthenticated: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthenticated,
}) => {
  const [isSignup, setIsSignup] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (isSignup && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error: signupError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          onAuthenticated();
        } else {
          setMessage(
            'Account created successfully. Please check your email if confirmation is required, then sign in.'
          );
          setIsSignup(false);
          setPassword('');
        }
      } else {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          throw loginError;
        }

        if (data.session) {
          onAuthenticated();
        }
      }
    } catch (err: any) {
      console.error('TRACEX authentication error:', err);

      setError(
        err?.message ||
          'Authentication failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignup((current) => !current);
    setError('');
    setMessage('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* BRAND */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 mb-5">
            <div className="w-7 h-7 rounded-lg border-2 border-cyan-400 relative">
              <div className="absolute inset-2 rounded-sm bg-cyan-400" />
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-[0.18em] text-white">
            TRACEX
          </h1>

          <p className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-slate-400">
            Criminal Intelligence Platform
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-7 pt-7 pb-5">
            <div className="mb-6">
              <p className="text-[11px] font-mono font-bold tracking-widest text-cyan-600 uppercase">
                Secure Officer Access
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {isSignup
                  ? 'Create investigator account'
                  : 'Sign in to TRACEX'}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {isSignup
                  ? 'Create an account to access assigned investigation cases.'
                  : 'Use your registered email ID and password to continue.'}
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm font-medium text-rose-700">
                  {error}
                </p>
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-medium text-emerald-700">
                  {message}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* FULL NAME */}
              {isSignup && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    FULL NAME
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                  />
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  EMAIL ID
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="officer@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  PASSWORD
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    isSignup ? 'new-password' : 'current-password'
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'AUTHENTICATING...'
                  : isSignup
                    ? 'CREATE ACCOUNT'
                    : 'SIGN IN'}
              </button>
            </form>
          </div>

          {/* SWITCH */}
          <div className="border-t border-slate-200 bg-slate-50 px-7 py-5 text-center">
            <p className="text-sm text-slate-500">
              {isSignup
                ? 'Already have an account?'
                : "Don't have an account?"}
            </p>

            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
              className="mt-1 text-sm font-bold text-cyan-700 hover:text-cyan-900 disabled:opacity-50"
            >
              {isSignup
                ? 'Sign in instead'
                : 'Create a new investigator account'}
            </button>
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <div className="mt-6 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Authorized personnel only
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            Case access is controlled by authenticated user permissions.
          </p>
        </div>
      </div>
    </div>
  );
};