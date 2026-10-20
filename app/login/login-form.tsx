'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELD =
  'tap mt-1 w-full border border-rule bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-rule-strong';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? 'That did not work. Try again.');
        setPending(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-ink">
          Name
        </label>
        {/*
          The name is the identity: every plate logged from this phone is
          stamped with it until sign-out. Lower case is fine, the server folds
          case, and the phone is told not to capitalise or autocorrect a name
          it does not know.
        */}
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tap w-full border border-plate-green bg-plate-green px-4 py-3 text-base font-semibold text-plate-white disabled:border-rule disabled:bg-rule disabled:text-ink-faint"
      >
        {pending ? 'Checking' : 'Sign in'}
      </button>
    </form>
  );
}
