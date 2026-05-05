import ModuleClient from './ModuleClient';

export const generateStaticParams = () => [{ id: '1' }];

export default function ModulePage() {
  return <ModuleClient />;
}
