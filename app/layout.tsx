
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://previouslyon.vercel.app"),
  title: {
    default: "PreviouslyOn - Track Your TV Shows",
    template: "%s | PreviouslyOn",
  },
  description: "The social network for TV lovers. Track shows, seasons, and episodes. See what friends are watching.",
  authors: [{ name: "aharshit123456", url: "https://aharshit123456.github.io" }],
  creator: "aharshit123456",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "PreviouslyOn",
    title: "PreviouslyOn - Track Your TV Shows",
    description: "The social network for TV lovers. Track shows, seasons, and episodes.",
    images: [
      {
        url: "/og-image.png", // We'll need to ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: "PreviouslyOn Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PreviouslyOn - Track Your TV Shows",
    description: "The social network for TV lovers. Track shows, seasons, and episodes.",
    creator: "@aharshit123456", // Assuming handle
  },
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col relative`}
      >
        {/* Global Grid Background */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid-pattern opacity-60" />

        <AuthProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>

            <footer className="bg-white border-t border-gray-200 py-12 text-center text-sm text-gray-500 mt-20">
              <div className="container-custom space-y-2">
                <p>© {new Date().getFullYear()} PreviouslyOn. Data provided by TMDB.</p>
                <p>
                  This project is open source and available on <a href="https://github.com/aharshit123456/previouslyon" target="_blank" rel="noopener noreferrer" className="text-black font-bold hover:underline">GitHub</a>.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
