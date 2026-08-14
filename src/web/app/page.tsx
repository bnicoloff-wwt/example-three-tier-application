import { getTasks } from './actions';
import { HomeClient } from './HomeClient';

export default async function Home() {
  const tasks = await getTasks();

  return <HomeClient initialTasks={tasks} />;
}
