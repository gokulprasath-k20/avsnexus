import TaskClient from './TaskClient';

export const generateStaticParams = () => [{ id: '1' }];

export default function TaskPage() {
  return <TaskClient />;
}
