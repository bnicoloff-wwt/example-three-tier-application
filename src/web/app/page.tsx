import { getTasks } from './actions';
import { HomeClient } from './HomeClient';

export const metadata = {
  title: 'To-Do List',
  description: 'Manage your tasks',
};

export default async function Home() {
  const tasks = await getTasks();

  return <HomeClient initialTasks={tasks} />;
}
