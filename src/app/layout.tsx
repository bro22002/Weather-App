import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meteorology Hub | Real-time Weather",
  description: "A premium overview of real-time sensor data across weather stations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
