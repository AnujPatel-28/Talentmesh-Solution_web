import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
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
    default: "TalentMesh | #1 AI-Driven Recruitment & Matching Platform",
    template: "%s | TalentMesh - Modern AI Hiring"
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
    title: "TalentMesh | AI Recruitment Platform",
    description: "Hire top talent with the power of AI.",
  },
  verification: {
    google: "https://talentmeshsolutions.com",
  },
  icons: {
    icon: '/TalentMesh White Logo.png',
  },
};

import { AuthProvider } from "@/lib/auth/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jakarta.variable} antialiased`}
      >
        <AuthProvider>
          <NavbarWrapper>
            <Navbar />
          </NavbarWrapper>
          {children}
          <NavbarWrapper showFooter>
            <Footer />
          </NavbarWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

