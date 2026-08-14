'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-6">
        <Link
          href="/"
          className={`font-medium text-sm transition-colors ${
            pathname === '/'
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
          }`}
        >
          📋 To-Do List
        </Link>
        <Link
          href="/hello"
          className={`font-medium text-sm transition-colors ${
            pathname === '/hello'
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
          }`}
        >
          👋 Hello World
        </Link>
      </div>
    </nav>
  );
}
