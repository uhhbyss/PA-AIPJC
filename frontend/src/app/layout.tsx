import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SettingsProvider } from "@/context/SettingsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Journaling Companion",
  description: "A private, empathetic journaling app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <SettingsProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
