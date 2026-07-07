import type { Metadata } from 'next';
import '../styles/globals.css';
import { Header } from '@/components/wiser/Header';

export const metadata: Metadata = {
  title: 'Wiser — know what you feed',
  description: 'Photograph a cat-food pack, get a standards-grounded Buy / Skip verdict.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-24">{children}</main>
        <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
          Wiser · grounded in IS-11968, FEDIAF &amp; AAFCO standards, WSAVA governing · not a
          substitute for veterinary advice
        </footer>
      </body>
    </html>
  );
}
