'use client';

import { useState } from 'react';
import { getTasks, createTask, toggleTask, updateTaskPriority } from './actions';
import { BulkImportModal } from './BulkImportModal';
import type { Task, Priority } from './actions';

const PRIORITY_COLORS = {
  low: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function HomeClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const handleRefreshTasks = async () => {
    setIsLoading(true);
    try {
      const updated = await getTasks();
      setTasks(updated);
      setShowBulkImport(false);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = priorityFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.priority === priorityFilter);

  return (
    <>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              To-Do List
            </h1>
            <button
              onClick={() => setShowBulkImport(true)}
              className="text-sm px-3 py-1.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-medium"
              title="Bulk import tasks from JSON or CSV"
            >
              📥 Import
            </button>
          </div>

          {/* Add task form */}
          <form action={createTask} className="mb-8">
            <div className="flex gap-2 mb-3">
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
            </div>
            <div className="flex gap-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 self-center">
                Priority:
              </label>
              <select
                name="priority"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                className="text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </form>

          {/* Priority filter buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPriorityFilter('all')}
              className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                priorityFilter === 'all'
                  ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              All
            </button>
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`text-xs px-3 py-1.5 rounded font-medium transition-colors border ${
                  priorityFilter === p
                    ? `${PRIORITY_COLORS[p]} border-current`
                    : `border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500`
                }`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Task list */}
          <ul className="space-y-2">
            {filteredTasks.length === 0 && tasks.length === 0 && (
              <li className="text-zinc-400 text-center py-8">No tasks yet. Add one above or use bulk import!</li>
            )}
            {filteredTasks.length === 0 && tasks.length > 0 && (
              <li className="text-zinc-400 text-center py-8">No tasks with this priority level.</li>
            )}
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3"
              >
                <form
                  action={async () => {
                    'use server';
                    await toggleTask(task.id, !task.completed);
                  }}
                >
                  <button
                    type="submit"
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
                </form>
                <span
                  className={`flex-1 text-sm ${
                    task.completed
                      ? 'line-through text-zinc-400'
                      : 'text-zinc-800 dark:text-zinc-100'
                  }`}
                >
                  {task.title}
                </span>
                <form
                  action={async () => {
                    'use server';
                    // Cycle through priorities
                    const priorities: Priority[] = ['low', 'medium', 'high'];
                    const currentIndex = priorities.indexOf(task.priority);
                    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                    await updateTaskPriority(task.id, nextPriority);
                  }}
                >
                  <button
                    type="submit"
                    className={`text-xs px-2 py-1 rounded font-medium border transition-colors cursor-pointer hover:opacity-80 ${PRIORITY_COLORS[task.priority]}`}
                    title="Click to cycle priority: Low → Medium → High → Low"
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </button>
                </form>
              </li>
            ))}
          </ul>

          {tasks.length > 0 && (
            <p className="mt-4 text-xs text-zinc-400 text-right">
              {tasks.filter((t) => t.completed).length} / {tasks.length} completed
            </p>
          )}
        </div>
      </div>

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={handleRefreshTasks}
        />
      )}
    </>
  );
}
