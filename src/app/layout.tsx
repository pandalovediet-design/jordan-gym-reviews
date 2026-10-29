import { baseUrl } from "@/lib/base-url";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { JsonLd } from "@/lib/jsonld";
import { PwaRegister } from "@/components/PwaRegister";
import { QuranAudioProvider, QuranMiniBar } from "@/components/QuranAudio";

export const viewport: Viewport = { themeColor: "#f7f9f6" };

export const metadata: Metadata = {
  applicationName: "GymJo",
  appleWebApp: { capable: true, title: "GymJo", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/brand-mark.svg", type: "image/svg+xml" }],
    shortcut: "/brand-mark.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  metadataBase: new URL(baseUrl()),
  title: "GymJo | اكتشف ناديك في الأردن",
  description:
    "اكتشف النوادي والمدربين والمتاجر الرياضية في الأردن: الأسعار، الدوام، الموقع، والتواصل المباشر.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <Script id="gymjo-theme-init" strategy="beforeInteractive">{"try { const saved = localStorage.getItem('gymjo-theme'); const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; if (dark) { document.documentElement.classList.add('dark'); document.querySelector('meta[name=\"theme-color\"]')?.setAttribute('content', '#17212b'); } } catch (_) {}"}</Script>
      <body className="min-h-full flex flex-col">
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": `${baseUrl()}/#org`, name: "GymJo", url: baseUrl(), logo: `${baseUrl()}/brand-mark.svg`, areaServed: { "@type": "Country", name: "Jordan" }, knowsLanguage: "ar" },
          { "@type": "WebSite", "@id": `${baseUrl()}/#site`, name: "GymJo", url: baseUrl(), inLanguage: "ar", publisher: { "@id": `${baseUrl()}/#org` },
            potentialAction: { "@type": "SearchAction", target: `${baseUrl()}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } },
        ] }} />
        <QuranAudioProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <QuranMiniBar />
        </QuranAudioProvider>
        <PwaRegister />
      </body>
    </html>
  );
}