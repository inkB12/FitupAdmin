import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FITUP Admin",
  description: "Admin portal for FITUP operations, users, trainers, and content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
