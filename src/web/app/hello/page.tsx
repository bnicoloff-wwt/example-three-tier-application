export default async function HelloPage() {
  let asciiArt = '';
  let error = '';

  try {
    const response = await fetch('http://api:3001/hello', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    asciiArt = data.asciiArt || '';
  } catch (err) {
    error = `Failed to load ASCII art: ${err instanceof Error ? err.message : 'Unknown error'}`;
    console.error('Error fetching hello data:', err);
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          Hello World
        </h1>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8">
          {error ? (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                ⚠️ {error}
              </p>
            </div>
          ) : (
            <>
              <pre className="font-mono text-xs sm:text-sm overflow-x-auto bg-zinc-900 dark:bg-zinc-950 text-green-400 p-6 rounded-lg border border-zinc-700 dark:border-zinc-800 leading-tight">
                {asciiArt}
              </pre>
              <p className="mt-6 text-zinc-600 dark:text-zinc-400 text-center text-sm">
                Welcome! This is a demonstration of ASCII art rendering in the example application.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
