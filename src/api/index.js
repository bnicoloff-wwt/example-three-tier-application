const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /categories — list all categories
app.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /categories — create a category
app.post('/categories', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const categoryColor = color || '#3b82f6';
    const { rows } = await db.query(
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *',
      [name.trim(), categoryColor]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    next(err);
  }
});

// DELETE /categories/:id — delete a category
app.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /tasks — list all tasks (optionally filtered by category)
app.get('/tasks', async (req, res, next) => {
  try {
    const categoryId = req.query.category_id;
    let query = 'SELECT tasks.*, categories.name as category_name, categories.color as category_color FROM tasks LEFT JOIN categories ON tasks.category_id = categories.id';
    const params = [];

    if (categoryId) {
      query += ' WHERE tasks.category_id = $1';
      params.push(parseInt(categoryId, 10));
    }

    query += ' ORDER BY tasks.created_at ASC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /tasks — create a task
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, category_id } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const { rows } = await db.query(
      'INSERT INTO tasks (title, category_id) VALUES ($1, $2) RETURNING *',
      [title.trim(), category_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:id — update a task (complete/uncomplete, rename, or change category)
app.patch('/tasks/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { completed, title, category_id } = req.body;

    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const current = rows[0];
    const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
    const newTitle = title !== undefined ? title.trim() : current.title;
    const newCategoryId = category_id !== undefined ? category_id : current.category_id;

    const { rows: updated } = await db.query(
      'UPDATE tasks SET completed = $1, title = $2, category_id = $3 WHERE id = $4 RETURNING *',
      [newCompleted, newTitle, newCategoryId, id]
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
