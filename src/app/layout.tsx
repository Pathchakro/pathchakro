import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali, DM_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import dbConnect from "@/lib/mongodb";
import SystemConfig from "@/models/SystemConfig";

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

// Helper function to extract content from HTML meta string if user inputs a full tag
function extractMetaContent(metaInput: string | undefined): string | undefined {
  if (!metaInput) return undefined;
  const trimmed = metaInput.trim();
  if (trimmed.startsWith("<meta") || trimmed.includes("content=")) {
    const match = trimmed.match(/content=["']([^"']+)["']/i);
    return match ? match[1] : undefined;
  }
  return trimmed;
}

const baseMetadata: Metadata = {
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

export async function generateMetadata(): Promise<Metadata> {
  let googleVerification: string | undefined;
  let fbVerification: string | undefined;

  try {
    await dbConnect();
    const config = await SystemConfig.findOne().sort({ updatedAt: -1 }).lean();
    if (config) {
      googleVerification = extractMetaContent(config.searchConsoleMeta);
      fbVerification = extractMetaContent(config.facebookDomainVerification);
    }
  } catch (error) {
    console.error("Error loading system config for layout metadata:", error);
  }

  return {
    ...baseMetadata,
    verification: {
      google: googleVerification || undefined,
    },
    other: {
      ...baseMetadata.other,
      ...(fbVerification ? { "facebook-domain-verification": fbVerification } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let config: any = null;
  try {
    await dbConnect();
    config = await SystemConfig.findOne().sort({ updatedAt: -1 }).lean();
  } catch (error) {
    console.error("Error fetching system config in RootLayout:", error);
  }

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
        {/* Google Tag Manager */}
        {config?.googleTagManagerId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${config.googleTagManagerId}');`,
            }}
          />
        )}
        {/* Google Analytics (gtag.js) */}
        {config?.googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${config.googleAnalyticsId}');
                `,
              }}
            />
          </>
        )}
        {/* Meta Pixel (Facebook Pixel) */}
        {config?.metaPixelId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${config.metaPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body className={`${inter.variable} ${dmSans.variable} ${notoSansBengali.variable} antialiased font-sans`} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        {config?.googleTagManagerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${config.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* Meta Pixel (noscript) */}
        {config?.metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${config.metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
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
