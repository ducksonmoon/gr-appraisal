import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PRODUCT_NAME, UNIVERSITY_NAME } from '@/lib/brand';
import { vazirmatn } from '@/lib/fonts';

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | ${UNIVERSITY_NAME}`,
  description: 'ثبت، مدیریت و تحلیل ارزیابی اعضای هیئت علمی',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={`${vazirmatn.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
