import type { Metadata, Viewport } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://ai-fashion-studio-3d.vercel.app";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui",
  description:
    "An interactive 3D fashion product customizer built by Aisha.A.Siddiqui. Design, customize and explore fashion products in an immersive browser-based experience using Next.js and React Three Fiber.",
  authors: [{ name: "Aisha.A.Siddiqui" }],
  creator: "Aisha.A.Siddiqui",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "AI Fashion Studio 3D",
    title: "AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui",
    description:
      "An interactive 3D fashion product customizer built by Aisha.A.Siddiqui. Design, customize and explore fashion products in an immersive browser-based experience.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui",
    description:
      "An interactive 3D fashion product customizer built by Aisha.A.Siddiqui. Design, customize and explore fashion products in an immersive browser-based experience.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0B1F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
