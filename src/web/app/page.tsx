import { getTasks, getCategories, createTask, toggleTask, updateTaskCategory, createCategory, deleteCategory } from './actions';

export default async function Home() {
  const tasks = await getTasks();
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          To-Do List
        </h1>

        {/* Categories section */}
        <div className="mb-8 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Categories
          </h2>
          <div className="space-y-3 mb-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-600"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {category.name}
                  </span>
                </div>
                <form
                  action={async () => {
                    'use server';
                    await deleteCategory(category.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>

          {/* Add category form */}
          <form action={createCategory} className="flex gap-2">
            <input
              name="name"
              type="text"
              required
              placeholder="Category name..."
              className="flex-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <input
              name="color"
              type="color"
              defaultValue="#3b82f6"
              className="w-12 h-9 rounded border border-zinc-300 dark:border-zinc-600 cursor-pointer"
            />
            <button
              type="submit"
              className="rounded bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        {/* Add task form */}
        <form action={createTask} className="flex gap-2 mb-8">
          <input
            name="title"
            type="text"
            required
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <select
            name="category_id"
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2 font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Task list */}
        <ul className="space-y-2">
          {tasks.length === 0 && (
            <li className="text-zinc-400 text-center py-8">No tasks yet. Add one above!</li>
          )}
          {tasks.map((task) => (
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
              {task.category_id && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: task.category_color || '#3b82f6' }}
                >
                  {task.category_name}
                </div>
              )}
              <form
                action={async () => {
                  'use server';
                  await updateTaskCategory(task.id, null);
                }}
              >
                {task.category_id && (
                  <button
                    type="submit"
                    className="text-xs px-2 py-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label="Remove category"
                  >
                    ✕
                  </button>
                )}
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
  );
}
