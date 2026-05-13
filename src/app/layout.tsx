import type { Metadata } from "next";
import { Inter, Playfair_Display, UnifrakturMaguntia } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const oldEnglish = UnifrakturMaguntia({ weight: "400", subsets: ["latin"], variable: "--font-old-english" });

export const metadata: Metadata = {
  title: "Supa News! | O seu jornal digital automatizado",
  description: "Notícias frescas geradas por inteligência artificial em tempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${inter.variable} ${playfair.variable} ${oldEnglish.variable} antialiased`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {children}
        </div>

        {/* Script do Google Translate */}
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({pageLanguage: 'pt'}, 'google_translate_element');
            }
          `}
        </Script>
        <Analytics />
      </body>
    </html>
  );
}
