const express = require('express');
const db = require('./db');

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

// =====================
// DAD JOKES ENDPOINTS
// =====================

// GET /dad-jokes — list all jokes with pagination
app.get('/dad-jokes', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'rating'; // 'rating' or 'newest'
    const offset = (page - 1) * limit;

    const orderBy = sort === 'newest' ? 'created_at DESC' : 'rating DESC, created_at DESC';

    const { rows, rowCount } = await db.query(
      `SELECT * FROM dad_jokes ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await db.query('SELECT COUNT(*) as total FROM dad_jokes');
    const total = parseInt(countRows[0].total);

    res.json({
      jokes: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /dad-jokes/random — get a random joke
app.get('/dad-jokes/random', async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM dad_jokes ORDER BY RANDOM() LIMIT 1'
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No jokes found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /dad-jokes/:id — get a specific joke
app.get('/dad-jokes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await db.query('SELECT * FROM dad_jokes WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Joke not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /dad-jokes — create a new joke
app.post('/dad-jokes', async (req, res, next) => {
  try {
    const { setup, punchline } = req.body;

    // Validate input
    if (!setup || typeof setup !== 'string' || !setup.trim()) {
      return res.status(400).json({ error: 'setup is required' });
    }

    if (!punchline || typeof punchline !== 'string' || !punchline.trim()) {
      return res.status(400).json({ error: 'punchline is required' });
    }

    if (setup.trim().length > 1000) {
      return res.status(400).json({ error: 'setup must be 1000 characters or less' });
    }

    if (punchline.trim().length > 1000) {
      return res.status(400).json({ error: 'punchline must be 1000 characters or less' });
    }

    const { rows } = await db.query(
      'INSERT INTO dad_jokes (setup, punchline) VALUES ($1, $2) RETURNING *',
      [setup.trim(), punchline.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /dad-jokes/:id/rating — rate/upvote a joke
app.patch('/dad-jokes/:id/rating', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { value } = req.body; // value should be 1 for upvote, -1 for downvote

    if (![-1, 1].includes(value)) {
      return res.status(400).json({ error: 'rating value must be 1 (upvote) or -1 (downvote)' });
    }

    const { rows } = await db.query(
      'SELECT * FROM dad_jokes WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Joke not found' });
    }

    const joke = rows[0];
    const newRating = joke.rating + value;
    const newRatingCount = joke.rating_count + 1;

    const { rows: updated } = await db.query(
      'UPDATE dad_jokes SET rating = $1, rating_count = $2 WHERE id = $3 RETURNING *',
      [newRating, newRatingCount, id]
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
