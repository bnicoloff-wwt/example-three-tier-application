const express = require('express');
const db = require('./db');
const errorHandler = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /tasks — list all tasks
app.get('/tasks', async (_req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /tasks — create a task
app.post('/tasks', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const { rows } = await db.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /tasks/bulk — bulk import tasks
app.post('/tasks/bulk', async (req, res, next) => {
  try {
    const { tasks } = req.body;

    // Validate input
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'tasks must be an array' });
    }

    if (tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array cannot be empty' });
    }

    if (tasks.length > 1000) {
      return res.status(400).json({ error: 'Cannot import more than 1000 tasks at once' });
    }

    // Validate and prepare tasks
    const validatedTasks = [];
    const errors = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.title || typeof task.title !== 'string' || !task.title.trim()) {
        errors.push({ index: i, error: 'title is required and must be a string' });
        continue;
      }

      // Optional: title must be <= 500 characters
      if (task.title.trim().length > 500) {
        errors.push({ index: i, error: 'title must be 500 characters or less' });
        continue;
      }

      validatedTasks.push({
        title: task.title.trim(),
        completed: task.completed === true ? true : false,
      });
    }

    // If all tasks failed validation, return error
    if (validatedTasks.length === 0) {
      return res.status(400).json({
        error: 'No valid tasks to import',
        validationErrors: errors,
      });
    }

    // Insert all validated tasks
    const insertedTasks = [];
    for (const task of validatedTasks) {
      const { rows } = await db.query(
        'INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *',
        [task.title, task.completed]
      );
      insertedTasks.push(rows[0]);
    }

    res.status(201).json({
      imported: insertedTasks.length,
      total: tasks.length,
      skipped: errors.length,
      tasks: insertedTasks,
      validationErrors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:id — update a task (complete/uncomplete or rename)
app.patch('/tasks/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { completed, title } = req.body;

    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const current = rows[0];
    const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
    
    // Validate and prepare new title if provided
    let newTitle = current.title;
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'title must be a non-empty string' });
      }
      newTitle = title.trim();
    }

    const { rows: updated } = await db.query(
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [newCompleted, newTitle, id]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

// Global error handler middleware (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
