import AdminClient from './AdminClient';

export const generateStaticParams = () => [{ id: '1' }];

export default function AdminDetailPage() {
  return <AdminClient />;
}
