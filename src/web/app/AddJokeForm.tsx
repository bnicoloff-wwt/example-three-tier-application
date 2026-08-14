'use client';

import { useState } from 'react';
import { createDadJoke } from './actions';

export function AddJokeForm() {
  const [setup, setSetup] = useState('');
  const [punchline, setPunchline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!setup.trim() || !punchline.trim()) {
      setError('Both setup and punchline are required');
      return;
    }

    setIsLoading(true);
    try {
      await createDadJoke(setup, punchline);
      setSetup('');
      setPunchline('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add joke');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
        ✍️ Share Your Dad Joke
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={setup}
          onChange={(e) => setSetup(e.target.value)}
          placeholder="Setup (the setup to your joke)..."
          maxLength={1000}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
        />

        <input
          type="text"
          value={punchline}
          onChange={(e) => setPunchline(e.target.value)}
          placeholder="Punchline (the joke's punchline)..."
          maxLength={1000}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !setup.trim() || !punchline.trim()}
            className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Adding...' : 'Add Joke'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 text-green-700 dark:text-green-300 text-sm">
            ✓ Joke added! Thanks for sharing!
          </div>
        )}
      </form>
    </div>
  );
}
