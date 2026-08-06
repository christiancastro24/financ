import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinControl - PlanChris",
  description: "Controle financeiro pessoal e investimentos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen overflow-x-hidden`}>
        <Sidebar />
        <Header />
        <main className="ml-[250px] mt-[70px] flex-1 p-8 min-h-[calc(100vh-70px)] max-w-[calc(100vw-250px)] overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
