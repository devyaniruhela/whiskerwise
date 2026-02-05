import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import SessionTracker from "@/components/SessionTracker";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Whisker Wise — Curated with care. Trusted by whiskers.",
  description: "Research-backed cat nutrition. Get evidence-based insights with Wiser, our cat food analysis tool.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Whisker Wise — Curated with care. Trusted by whiskers.",
    description: "Research-backed cat nutrition. Get evidence-based insights with Wiser, our cat food analysis tool.",
    images: ["/logo-dark2.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Whisker Wise — Curated with care. Trusted by whiskers.",
    description: "Research-backed cat nutrition. Get evidence-based insights with Wiser, our cat food analysis tool.",
    images: ["/logo-dark2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="grain bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-50 min-h-screen pt-20">
        <SessionTracker />
        {children}
      </body>
    </html>
  );
}
