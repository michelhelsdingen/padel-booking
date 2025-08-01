import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LTC Padel Lessen Planner",
  description: "Inschrijven voor wekelijkse padellessen bij LTC de Kei",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster 
          position="top-center"
          toastOptions={{
            success: {
              style: {
                background: '#10b981',
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#ef4444',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
