'use server';

import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
};

export type Category = {
  id: number;
  name: string;
  color: string;
  created_at: string;
};

export async function getTasks(categoryId?: number): Promise<Task[]> {
  const url = categoryId
    ? `${API_URL}/tasks?category_id=${categoryId}`
    : `${API_URL}/tasks`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  const categoryId = formData.get('category_id') as string;
  await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      category_id: categoryId ? parseInt(categoryId, 10) : null,
    }),
  });
  revalidatePath('/');
}

export async function toggleTask(id: number, completed: boolean) {
  await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  revalidatePath('/');
}

export async function updateTaskCategory(id: number, categoryId: number | null) {
  await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_id: categoryId }),
  });
  revalidatePath('/');
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const color = formData.get('color') as string;
  await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  revalidatePath('/');
}

export async function deleteCategory(id: number) {
  await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  revalidatePath('/');
}
