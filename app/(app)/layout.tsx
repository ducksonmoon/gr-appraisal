import { DataProvider } from '@/contexts/DataContext';

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider>{children}</DataProvider>;
}
