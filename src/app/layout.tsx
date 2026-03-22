import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali, DM_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-sans-bengali",
});

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "PathChakro - Social Learning & Book Lovers Platform",
    template: "%s | PathChakro"
  },
  description: "Connect, share, and learn with PathChakro - a social media platform for book lovers, students, and educators.",
  keywords: ["social learning", "books", "education", "PathChakro", "learning community", "book reviews", "study groups"],
  authors: [{ name: "PathChakro Team" }],
  creator: "PathChakro",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pathchakro.com",
    title: "PathChakro - Social Learning & Book Lovers Platform",
    description: "Connect, share, and learn with PathChakro - a social media platform for book lovers, students, and educators",
    siteName: "PathChakro",
    images: [
      {
        url: "/OG_pathchakro.png",
        width: 1200,
        height: 630,
        alt: "PathChakro Social Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PathChakro - Social Learning & Book Lovers Platform",
    description: "Connect, share, and learn with PathChakro - a social media platform for book lovers, students, and educators",
    images: ["/OG_pathchakro.png"],
    creator: "@pathchakro",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PathChakro",
  },
  icons: {
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PathChakro",
    "url": "https://pathchakro.com",
    "description": "Social learning platform for book lovers and educators.",
    "publisher": {
      "@type": "Organization",
      "name": "PathChakro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pathchakro.com/logo.png"
      }
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${dmSans.variable} ${notoSansBengali.variable} antialiased font-sans`} suppressHydrationWarning>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <InstallPrompt />
            <Toaster />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
