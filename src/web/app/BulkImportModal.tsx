'use client';

import { useState, useRef } from 'react';
import { bulkImportTasks } from './actions';
import type { Priority } from './actions';

type ImportStatus = 'idle' | 'parsing' | 'importing' | 'success' | 'error';

export function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseJsonText = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of tasks');
      }
      return parsed;
    } catch (err) {
      throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const parseCSVText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('CSV is empty');
    }

    const tasks = [];
    let headerRow = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (simple implementation, handles basic cases)
      const fields = line.split(',').map((f) => f.trim());

      if (i === 0) {
        // First row is header
        headerRow = fields;
        continue;
      }

      if (!headerRow) {
        throw new Error('No header row found');
      }

      // Build task object from fields
      const task: any = {};
      for (let j = 0; j < headerRow.length && j < fields.length; j++) {
        const header = headerRow[j].toLowerCase();
        const value = fields[j];

        if (header === 'title') {
          task.title = value;
        } else if (header === 'completed') {
          task.completed = value.toLowerCase() === 'true' || value === '1';
        } else if (header === 'priority') {
          task.priority = value.toLowerCase();
        }
      }

      if (task.title) {
        tasks.push(task);
      }
    }

    return tasks;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    setError(null);

    try {
      const text = await file.text();
      let tasks;

      if (file.name.endsWith('.json')) {
        tasks = parseJsonText(text);
      } else if (file.name.endsWith('.csv')) {
        tasks = parseCSVText(text);
      } else {
        // Try to detect format
        try {
          tasks = parseJsonText(text);
        } catch {
          tasks = parseCSVText(text);
        }
      }

      await performImport(tasks);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePasteText = async (format: 'json' | 'csv') => {
    if (!textInput.trim()) {
      setError('Please enter some text first');
      return;
    }

    setStatus('parsing');
    setError(null);

    try {
      let tasks;
      if (format === 'json') {
        tasks = parseJsonText(textInput);
      } else {
        tasks = parseCSVText(textInput);
      }

      await performImport(tasks);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const performImport = async (tasks: any[]) => {
    setStatus('importing');
    try {
      const result = await bulkImportTasks(tasks);
      setImportResult(result);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleClose = () => {
    if (status === 'success') {
      onSuccess();
    }
    onClose();
  };

  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setTextInput('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Bulk Import Tasks</h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {status === 'idle' && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Upload JSON or CSV file
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-zinc-900 dark:file:bg-zinc-50 file:text-white dark:file:text-zinc-900 file:font-medium hover:file:bg-zinc-700 dark:hover:file:bg-zinc-200"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Max 1000 tasks per import</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-zinc-800 text-zinc-500">Or paste below</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    JSON Format
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder='[{"title": "Task 1", "priority": "high"}, {"title": "Task 2", "completed": true, "priority": "low"}]'
                    className="w-full h-32 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                  <button
                    onClick={() => handlePasteText('json')}
                    className="mt-2 text-sm px-3 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    Import JSON
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    CSV Format
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">
                    Headers: title, completed (optional), priority (optional: low/medium/high)
                  </p>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="title,completed,priority&#10;Task 1,false,high&#10;Task 2,true,low"
                    className="w-full h-24 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono"
                  />
                  <button
                    onClick={() => handlePasteText('csv')}
                    className="mt-2 text-sm px-3 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    Import CSV
                  </button>
                </div>
              </div>
            </>
          )}

          {status === 'parsing' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto mb-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Parsing file...</p>
              </div>
            </div>
          )}

          {status === 'importing' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto mb-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Importing tasks...</p>
              </div>
            </div>
          )}

          {status === 'success' && importResult && (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  ✓ Import successful!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {importResult.imported} tasks imported
                  {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                </p>
              </div>

              {importResult.validationErrors && importResult.validationErrors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                    {importResult.validationErrors.length} validation errors
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                    {importResult.validationErrors.slice(0, 5).map((err: any, idx: number) => (
                      <li key={idx}>Row {err.index}: {err.error}</li>
                    ))}
                    {importResult.validationErrors.length > 5 && (
                      <li>... and {importResult.validationErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full px-4 py-2 rounded bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200"
              >
                Import More Tasks
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 rounded bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {status === 'idle' && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-6 py-3 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
