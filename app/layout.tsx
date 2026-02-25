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
    default: "TalentMesh | AI-Driven Recruitment Platform",
    template: "%s | TalentMesh"
  },
  description: "Revolutionizing recruitment with advanced AI matching technology. Connecting top talent with world-class companies effortlessly.",
  keywords: ["AI Recruitment", "Job Search", "Hiring Platform", "Talent Matching", "Tech Jobs"],
  verification: {
    google: "https://talentmeshsolutions.com",
  },
  icons: {
    icon: '/TalentMesh White Logo.png',
  },
};

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
        <NavbarWrapper>
          <Navbar />
        </NavbarWrapper>
        {children}
        <NavbarWrapper showFooter>
          <Footer />
        </NavbarWrapper>
      </body>
    </html>
  );
}

