import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";
import Header from "@/components/Header";
import ActivityLogger from "@/components/ActivityLogger";

import { Toaster } from "sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Face Studio - AI Image Generator",
  description: "Transform your photos with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ActivityLogger />
          <Header />
          {children}
          <LoginModal />
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
