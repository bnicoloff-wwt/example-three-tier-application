const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

// Valid priority values
const VALID_PRIORITIES = ['low', 'medium', 'high'];

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
    const { title, priority = 'medium' } = req.body;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    
    const { rows } = await db.query(
      'INSERT INTO tasks (title, priority) VALUES ($1, $2) RETURNING *',
      [title.trim(), priority]
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

      // Validate priority if provided
      const taskPriority = task.priority || 'medium';
      if (!VALID_PRIORITIES.includes(taskPriority)) {
        errors.push({ index: i, error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
        continue;
      }

      validatedTasks.push({
        title: task.title.trim(),
        completed: task.completed === true ? true : false,
        priority: taskPriority,
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
        'INSERT INTO tasks (title, completed, priority) VALUES ($1, $2, $3) RETURNING *',
        [task.title, task.completed, task.priority]
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

// PATCH /tasks/:id — update a task (complete/uncomplete, rename, or change priority)
app.patch('/tasks/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { completed, title, priority } = req.body;

    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const current = rows[0];
    const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
    const newTitle = title !== undefined ? title.trim() : current.title;
    const newPriority = priority !== undefined ? priority : current.priority;

    // Validate priority if provided
    if (priority !== undefined && !VALID_PRIORITIES.includes(newPriority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    const { rows: updated } = await db.query(
      'UPDATE tasks SET completed = $1, title = $2, priority = $3 WHERE id = $4 RETURNING *',
      [newCompleted, newTitle, newPriority, id]
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
