import type { Metadata } from "next";

import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lume — персональний ментор з довгою пам'яттю",
  description:
    "Платформа навчання, яка допомагає знайти і масштабувати те, ким ти вже є.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
