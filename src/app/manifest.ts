import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GYMJO | دليلك الرياضي في الأردن",
    short_name: "GYMJO",
    description: "نوادي ومدربين ومتاجر رياضية في الأردن: أسعار، دوام، موقع، وتواصل مباشر.",
    lang: "ar",
    dir: "rtl",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#04130c",
    theme_color: "#04130c",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}