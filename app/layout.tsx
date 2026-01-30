import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OIDAMRA - Guardaroba personale",
  description: "Gestione smart del guardaroba e creazione outfit in pochi minuti",
};

const manrope = Manrope({
  variable: "--font-body",
  display: "swap",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
