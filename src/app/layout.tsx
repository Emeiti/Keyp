import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Keyp.fo Store Directory',
  description: 'Directory of stores using Keyp.fo services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="max-w-7xl mx-auto py-12">
          {children}
        </div>
      </body>
    </html>
  );
}
