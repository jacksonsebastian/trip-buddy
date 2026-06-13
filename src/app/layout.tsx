import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trip Buddy — Plan, Track & Settle Group Trips",
  description:
    "All-in-one trip management for friend groups. Track budgets, payments, expenses, share photos, and settle up — all from your phone.",
  keywords: ["trip tracker", "group expenses", "splitwise alternative", "travel budget"],
  authors: [{ name: "Trip Buddy" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a1a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
