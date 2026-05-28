import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SMS Patient Reminder System — Project Roadmap",
  description:
    "Development roadmap for the SMS-Based Patient Reminder System for health facilities in Ghana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
