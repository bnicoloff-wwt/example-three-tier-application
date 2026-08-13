const request = require('supertest');
const app = require('./index');
const db = require('./db');

jest.mock('./db');

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', completed: false, created_at: '2024-01-01' },
        { id: 2, title: 'Task 2', completed: true, created_at: '2024-01-02' }
      ];
      db.query.mockResolvedValue({ rows: mockTasks });

      const response = await request(app).get('/tasks');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const newTask = { id: 1, title: 'New Task', completed: false, created_at: '2024-01-01' };
      db.query.mockResolvedValue({ rows: [newTask] });

      const response = await request(app)
        .post('/tasks')
        .send({ title: 'New Task' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newTask);
    });

    it('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('title is required');
    });

    it('should return 400 when title is empty string', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('title is required');
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task completion status', async () => {
      const existingTask = { id: 1, title: 'Task 1', completed: false, created_at: '2024-01-01' };
      const updatedTask = { id: 1, title: 'Task 1', completed: true, created_at: '2024-01-01' };
      
      db.query
        .mockResolvedValueOnce({ rows: [existingTask] })
        .mockResolvedValueOnce({ rows: [updatedTask] });

      const response = await request(app)
        .patch('/tasks/1')
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTask);
    });

    it('should update task title', async () => {
      const existingTask = { id: 1, title: 'Old Title', completed: false, created_at: '2024-01-01' };
      const updatedTask = { id: 1, title: 'New Title', completed: false, created_at: '2024-01-01' };
      
      db.query
        .mockResolvedValueOnce({ rows: [existingTask] })
        .mockResolvedValueOnce({ rows: [updatedTask] });

      const response = await request(app)
        .patch('/tasks/1')
        .send({ title: 'New Title' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTask);
    });

    it('should return 404 when task does not exist', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .patch('/tasks/999')
        .send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task successfully', async () => {
      const taskToDelete = { id: 1, title: 'Task 1', completed: false, created_at: '2024-01-01' };
      
      db.query
        .mockResolvedValueOnce({ rows: [taskToDelete] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/tasks/1');

      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    it('should return 404 when task does not exist', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const response = await request(app).delete('/tasks/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });

    it('should call db.query with correct parameters', async () => {
      const taskToDelete = { id: 42, title: 'Task to Delete', completed: false, created_at: '2024-01-01' };
      
      db.query
        .mockResolvedValueOnce({ rows: [taskToDelete] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app).delete('/tasks/42');

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM tasks WHERE id = $1', [42]);
      expect(db.query).toHaveBeenNthCalledWith(2, 'DELETE FROM tasks WHERE id = $1', [42]);
    });
  });
});
