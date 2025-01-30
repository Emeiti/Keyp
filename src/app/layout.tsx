import React from 'react';
import type { Metadata } from 'next';

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
      <body>{children}</body>
    </html>
  )
}
