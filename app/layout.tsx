import type { Metadata } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";

import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Atelier Forma — Architecture Studio",
  description:
    "A minimalist architecture studio portfolio highlighting crafted spaces, projects, and contact information."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
    <body className="font-sans text-text bg-background antialiased">
      <SessionProvider>{children}</SessionProvider>
    </body>
  </html>
);

export default RootLayout;

