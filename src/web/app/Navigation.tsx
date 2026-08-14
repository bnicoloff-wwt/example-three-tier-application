'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-zinc-900 dark:bg-zinc-950 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">App</h1>
          <div className="flex gap-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              📝 To-Do List
            </Link>
            <Link
              href="/weather"
              className={`px-3 py-2 rounded font-medium transition-colors ${
                pathname === '/weather'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              🌤️ Weather
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
