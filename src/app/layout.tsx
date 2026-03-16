import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meteorology Hub | Real-time Weather",
  description: "A premium overview of real-time sensor data across weather stations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
