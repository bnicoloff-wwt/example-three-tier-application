'use client';

import { useState, useEffect } from 'react';
import { getTasks, createTask, toggleTask, TasksResponse } from './actions';

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [tasksData, setTasksData] = useState<TasksResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTasks(currentPage, ITEMS_PER_PAGE);
        setTasksData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
        console.error('Error loading tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [currentPage]);

  const handleCreateTask = async (formData: FormData) => {
    try {
      await createTask(formData);
      // Reset to first page after creating a new task
      setCurrentPage(1);
      // Reload tasks
      const data = await getTasks(1, ITEMS_PER_PAGE);
      setTasksData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleToggleTask = async (id: number, completed: boolean) => {
    try {
      await toggleTask(id, !completed);
      // Reload current page
      if (tasksData) {
        const data = await getTasks(currentPage, ITEMS_PER_PAGE);
        setTasksData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task');
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (tasksData?.pagination.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (isLoading && !tasksData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  const tasks = tasksData?.data || [];
  const pagination = tasksData?.pagination;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          To-Do List
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900 px-4 py-3 text-red-800 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Add task form */}
        <form action={handleCreateTask} className="flex gap-2 mb-8">
          <input
            name="title"
            type="text"
            required
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2 font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Task list */}
        <ul className="space-y-2 mb-6">
          {tasks.length === 0 && (
            <li className="text-zinc-400 text-center py-8">
              {pagination?.total === 0 ? 'No tasks yet. Add one above!' : 'No tasks on this page.'}
            </li>
          )}
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => handleToggleTask(task.id, task.completed)}
                className={`h-5 w-5 rounded border-2 flex-shrink-0 transition-colors ${
                  task.completed
                    ? 'bg-zinc-900 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-50'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                }`}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.completed && (
                  <svg viewBox="0 0 12 12" className="text-white dark:text-zinc-900 w-full h-full p-0.5">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.completed
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-800 dark:text-zinc-100'
                }`}
              >
                {task.title}
              </span>
            </li>
          ))}
        </ul>

        {/* Pagination info and controls */}
        {pagination && pagination.total > 0 && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400 text-center">
              {tasks.filter((t) => t.completed).length} / {pagination.total} total completed
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={!pagination.hasPreviousPage}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Previous
              </button>

              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Page <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{pagination.totalPages}</span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>

            <div className="text-xs text-zinc-400 text-center">
              Showing {tasks.length} of {pagination.total} tasks
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
