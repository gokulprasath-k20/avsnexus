import EvaluateClient from './EvaluateClient';

export const generateStaticParams = () => [{ moduleId: '1' }];

export default function EvaluatePage() {
  return <EvaluateClient />;
}
