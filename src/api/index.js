const express = require('express');
const db = require('./db');
const { createLoginLimiter } = require('./utils/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

// Create rate limiter for login endpoint
const loginLimiter = createLoginLimiter();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// POST /login — authenticate user (rate-limited)
app.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'username is required' });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: 'password is required' });
    }

    // Note: In a real application, you would:
    // 1. Query the database for the user
    // 2. Hash and compare the password using bcrypt
    // 3. Generate and return a JWT token or session
    // For this demo, we'll return a simple success response
    res.json({
      success: true,
      message: 'Login successful',
      token: `demo-token-${Date.now()}`,
    });
  } catch (err) {
    next(err);
  }
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
    const newTitle = title !== undefined ? title.trim() : current.title;

    const { rows: updated } = await db.query(
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [newCompleted, newTitle, id]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

// Error handler (must be last)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
