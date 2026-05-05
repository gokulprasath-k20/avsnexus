import PlaygroundClient from './PlaygroundClient';

export const generateStaticParams = () => [{ taskId: '1' }];

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
