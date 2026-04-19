import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ReduxProvider } from "@/components/shared/ReduxProvider";
import { FloatingWhatsApp } from "@/components/store/shared/FloatingWhatsApp";
import { CartDrawer } from "@/components/store/cart/CartDrawer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Commerce Platform",
  description: "A full-stack e-commerce platform for clothes, shoes, apparel, and accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8D5B0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col font-body bg-background text-text-primary">
        <ReduxProvider>
          {children}
          <CartDrawer />
          <FloatingWhatsApp />
        </ReduxProvider>
        <Toaster />
      </body>
    </html>
  );
}
