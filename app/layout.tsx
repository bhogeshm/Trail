import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bhogesh — Motion Designer & Video Editor",
  description:
    "Bhogesh is a motion designer, video editor, and AI video editor crafting cinematic stories through motion.",
  openGraph: {
    title: "Bhogesh — Motion Designer & Video Editor",
    description:
      "Motion design, video editing, and AI-assisted video storytelling.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        <div className="grain" />
        <div className="vignette" />
        {children}
      </body>
    </html>
  );
}
