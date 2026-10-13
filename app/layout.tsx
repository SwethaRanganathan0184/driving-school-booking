import type { Metadata, Viewport } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Background from "./components/Background";
import { ThemeProvider, THEME_INIT_SCRIPT } from "./components/ThemeProvider";
import { settingsToVars } from "@/lib/theme";
import { getPublishedSettings } from "@/lib/siteSettings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublishedSettings();
  const description = `${s.tagline} Book driving lessons with trusted local instructors and pay after each class.`;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: `${s.siteName}: Driving lessons, booked simply`, template: `%s | ${s.siteName}` },
    description,
    applicationName: s.siteName,
    openGraph: { title: s.siteName, description: s.tagline, siteName: s.siteName, type: "website" },
    twitter: { card: "summary_large_image" },
    ...(s.faviconUrl ? { icons: { icon: s.faviconUrl } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#070B14",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getPublishedSettings();

  return (
    <html
      lang="en"
      data-theme={settings.preset}
      data-motion={settings.motion.intensity}
      style={settingsToVars(settings) as React.CSSProperties}
      className={`${geistSans.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider settings={settings}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-accent text-accent-fg px-3 py-2 rounded-md">
            Skip to content
          </a>
          <Background />
          <Navbar />
          <div id="main" className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
