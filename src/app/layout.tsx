import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CURRENT_BRAND } from "@/lib/brand";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import SimpleFooter from "@/components/SimpleFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamic metadata will be set in each deployment's environment
export const metadata: Metadata = {
  title: CURRENT_BRAND.name,
  description: CURRENT_BRAND.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gray-50 flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col w-full px-6">
            {children}
          </main>
          <footer className="flex-shrink-0">
            <SimpleFooter />
          </footer>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
