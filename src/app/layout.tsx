import { baseUrl } from "@/lib/base-url";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo";
import "@fontsource-variable/alexandria";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { JsonLd } from "@/lib/jsonld";
import { PwaRegister } from "@/components/PwaRegister";
import { BottomBar } from "@/components/SiteTabs";
import { QuranAudioProvider, QuranMiniBar } from "@/components/QuranAudio";

export const viewport: Viewport = { themeColor: "#04130c" };

export const metadata: Metadata = {
  applicationName: "GYMJO",
  appleWebApp: { capable: true, title: "GYMJO", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" }],
    shortcut: "/brand/icon-192.png",
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  metadataBase: new URL(baseUrl()),
  title: { default: "GYMJO | دليلك الرياضي في الأردن", template: "%s | GYMJO" },
  openGraph: { siteName: "GYMJO", images: ["/og-default.png"] },
  description:
    "اكتشف النوادي والمدربين والمتاجر الرياضية في الأردن: الأسعار، الدوام، الموقع، والتواصل المباشر.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": `${baseUrl()}/#org`, name: "GYMJO", url: baseUrl(), logo: `${baseUrl()}/brand/icon-512.png`, areaServed: { "@type": "Country", name: "Jordan" }, knowsLanguage: "ar" },
          { "@type": "WebSite", "@id": `${baseUrl()}/#site`, name: "GYMJO", url: baseUrl(), inLanguage: "ar", publisher: { "@id": `${baseUrl()}/#org` },
            potentialAction: { "@type": "SearchAction", target: `${baseUrl()}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } },
        ] }} />
        <QuranAudioProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <QuranMiniBar />
          <BottomBar />
        </QuranAudioProvider>
        <PwaRegister />
      </body>
    </html>
  );
}