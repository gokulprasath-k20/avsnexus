import ModuleAdminClient from './ModuleAdminClient';

export const generateStaticParams = () => [{ id: '1' }];

export default function ModuleAdminPage() {
  return <ModuleAdminClient />;
}
