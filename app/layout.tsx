import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import { Navbar, Footer, NavbarWrapper } from "@/components/layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TalentMesh | Next-Gen AI Recruitment & Smart Matching",
    template: "%s | TalentMesh Solutions | AI Recruiting Platform"
  },
  description: "Experience the future of hiring with TalentMesh. Our AI-powered platform connects top tech talent with world-class companies using advanced skill-matching algorithms. Hire faster, smarter, and more efficiently.",
  keywords: ["AI Recruitment Platform", "AI Job Matching", "Tech Recruitment", "Smart Hiring", "Talent Acquisition Software", "Recruitment Automation"],
  authors: [{ name: "TalentMesh Team" }],
  openGraph: {
    title: "TalentMesh | Revolutionary AI-Powered Recruitment",
    description: "Connect with the best opportunities using our advanced AI matching technology.",
    url: "https://talentmesh solutions.com",
    siteName: "TalentMesh",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TalentMesh Solutions | AI Recruitment Platform",
    description: "Hire top talent with the power of AI.",
  },
  verification: {
    google: "https://talentmeshsolutions.com",
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Talentmesh',
    statusBarStyle: 'default',
    capable: true,
  },
};

import { AuthProvider } from "@/lib/auth/AuthContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isPortal = host.startsWith("jobs.") || host.startsWith("app.") || host.startsWith("admin.");

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${jakarta.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <QueryProvider>
            {!isPortal ? (
              <>
                <NavbarWrapper>
                  <Navbar />
                </NavbarWrapper>
                {children}
                <NavbarWrapper showFooter>
                  <Footer />
                </NavbarWrapper>
              </>
            ) : (
              children
            )}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

