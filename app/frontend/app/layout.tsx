import type { Metadata } from 'next';
import Script from 'next/script';
import { Courier_Prime, Hanken_Grotesk, Oranienbaum } from 'next/font/google';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import '../styles/globals.css';
import { Header } from '@/components/wiser/Header';
import { NavDepthTracker } from '@/components/wiser/BackLink';
import { RouteTracker } from '@/components/analytics/RouteTracker';
import { GA_ID } from '@/lib/flags';

const serif = Oranienbaum({ weight: '400', subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = Courier_Prime({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const hand = localFont({ src: '../public/Coal-Hand-Luke.ttf', variable: '--font-hand', display: 'swap' });

export const metadata: Metadata = {
  title: 'Whisker Wise',
  description:
    'Better decisions for your cat, faster: curated cat-life essentials and a cat-food label analyzer grounded in published nutrition standards.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} ${hand.variable}`}>
      <body className="min-h-screen">
        <Header />
        {/* records in-app navigations so back controls can return to the
            previous screen (with its filters/scroll) rather than a fixed href */}
        <NavDepthTracker />
        {children}
        {/* Free basic layer (visitors / devices / geo). Custom events go to GA,
            not here - see lib/analytics.ts. */}
        <Analytics />
        {/* GA4: loads only once a key exists, so this is inert until then. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
            {/* Soft-navigation page_views (config above only counts the hard load). */}
            <RouteTracker />
          </>
        )}
      </body>
    </html>
  );
}
