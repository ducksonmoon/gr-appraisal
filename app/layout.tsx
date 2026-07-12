import type { Metadata } from "next";
import "./globals.css";
import FontLoader from "@/components/FontLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import { PRODUCT_NAME, UNIVERSITY_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | ${UNIVERSITY_NAME}`,
  description: "ثبت، مدیریت و تحلیل ارزیابی اعضای هیئت علمی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirfont@v30.1.0/dist/font-face.css"
        />
      </head>
      <body className="antialiased">
        <FontLoader />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
