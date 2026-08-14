'use client';

import { useState, useEffect } from 'react';
import { getRandomDadJoke, rateJoke } from './actions';
import type { DadJoke } from './actions';

export function DadJokesPanel() {
  const [joke, setJoke] = useState<DadJoke | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<1 | -1 | null>(null);

  const fetchRandomJoke = async () => {
    setIsLoading(true);
    setError(null);
    setUserRating(null);
    try {
      const newJoke = await getRandomDadJoke();
      setJoke(newJoke);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load joke');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomJoke();
  }, []);

  const handleRate = async (value: 1 | -1) => {
    if (!joke || userRating === value) return;

    try {
      const updatedJoke = await rateJoke(joke.id, value);
      setJoke(updatedJoke);
      setUserRating(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rate joke');
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        😄 Joke of the Moment
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-50 rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-300">
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : joke ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
          {/* Setup */}
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {joke.setup}
          </p>

          {/* Punchline */}
          <p className="text-lg text-zinc-700 dark:text-zinc-300 font-semibold">
            {joke.punchline}
          </p>

          {/* Rating section */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRate(1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  userRating === 1
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700'
                }`}
                title="Upvote this joke"
              >
                👍 {joke.rating > 0 && '+'}
                {joke.rating}
              </button>
              <button
                onClick={() => handleRate(-1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  userRating === -1
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700'
                }`}
                title="Downvote this joke"
              >
                👎
              </button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {joke.rating_count} votes
              </span>
            </div>

            <button
              onClick={fetchRandomJoke}
              className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              title="Get another joke"
            >
              🎲 Next Joke
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
