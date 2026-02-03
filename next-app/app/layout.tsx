import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Whisker Wise — Curated with care. Trusted by whiskers.",
  description: "Research-backed cat nutrition. Get evidence-based insights with Wiser, our cat food analysis tool.",
  icons: {
    icon: "/logo-light.png",
    shortcut: "/logo-light.png",
    apple: "/logo-light.png",
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
        {children}
      </body>
    </html>
  );
}
