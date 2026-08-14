'use server';

import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

export type DadJoke = {
  id: number;
  setup: string;
  punchline: string;
  rating: number;
  rating_count: number;
  created_at: string;
};

export type BulkImportResult = {
  imported: number;
  total: number;
  skipped: number;
  tasks: Task[];
  validationErrors?: Array<{ index: number; error: string }>;
};

export type GetJokesResponse = {
  jokes: DadJoke[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/tasks`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  revalidatePath('/');
}

export async function bulkImportTasks(tasks: Array<{ title: string; completed?: boolean }>): Promise<BulkImportResult> {
  const res = await fetch(`${API_URL}/tasks/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to import tasks');
  }

  const result = await res.json();
  revalidatePath('/');
  return result;
}

export async function toggleTask(id: number, completed: boolean) {
  await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  revalidatePath('/');
}

// =====================
// DAD JOKES ACTIONS
// =====================

export async function getDadJokes(page: number = 1, limit: number = 10, sort: string = 'rating'): Promise<GetJokesResponse> {
  const res = await fetch(`${API_URL}/dad-jokes?page=${page}&limit=${limit}&sort=${sort}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch jokes');
  return res.json();
}

export async function getRandomDadJoke(): Promise<DadJoke> {
  const res = await fetch(`${API_URL}/dad-jokes/random`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch random joke');
  return res.json();
}

export async function getDadJoke(id: number): Promise<DadJoke> {
  const res = await fetch(`${API_URL}/dad-jokes/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch joke');
  return res.json();
}

export async function createDadJoke(setup: string, punchline: string): Promise<DadJoke> {
  const res = await fetch(`${API_URL}/dad-jokes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup, punchline }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create joke');
  }

  revalidatePath('/');
  return res.json();
}

export async function rateJoke(id: number, value: 1 | -1): Promise<DadJoke> {
  const res = await fetch(`${API_URL}/dad-jokes/${id}/rating`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to rate joke');
  }

  revalidatePath('/');
  return res.json();
}
