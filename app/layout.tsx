
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PreviouslyOn - Track Your TV Shows",
  description: "Letterboxd for TV. Track shows, seasons, and episodes.",
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
