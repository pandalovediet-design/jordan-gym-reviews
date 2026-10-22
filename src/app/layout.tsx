import { baseUrl } from "@/lib/base-url";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { JsonLd } from "@/lib/jsonld";
import { PwaRegister } from "@/components/PwaRegister";

export const viewport: Viewport = { themeColor: "#07211c" };

export const metadata: Metadata = {
  applicationName: "Jordan Gym",
  appleWebApp: { capable: true, title: "Jordan Gym", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  metadataBase: new URL(baseUrl()),
  title: "Jordan Gym Reviews | دليل الرياضة في الأردن",
  description:
    "اكتشف النوادي والمدربين والمتاجر الرياضية في الأردن: الأسعار، الدوام، الموقع، والتواصل المباشر.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": `${baseUrl()}/#org`, name: "Jordan Gym Reviews", url: baseUrl(), logo: `${baseUrl()}/logo-mark.png`, areaServed: { "@type": "Country", name: "Jordan" }, knowsLanguage: "ar" },
          { "@type": "WebSite", "@id": `${baseUrl()}/#site`, name: "Jordan Gym Reviews", url: baseUrl(), inLanguage: "ar", publisher: { "@id": `${baseUrl()}/#org` },
            potentialAction: { "@type": "SearchAction", target: `${baseUrl()}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } },
        ] }} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <PwaRegister />
      </body>
    </html>
  );
}
