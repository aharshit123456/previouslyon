
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
    icon: "/favicon.ico",
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
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-[#2c3440] py-8 text-center text-sm text-[#99aabb]">
            <div className="container-custom">
              <p>© {new Date().getFullYear()} PreviouslyOn. Data provided by TMDB.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
