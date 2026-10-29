import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymJo | دليلك الرياضي في الأردن",
    short_name: "GymJo",
    description: "نوادي ومدربين ومتاجر رياضية في الأردن: أسعار، دوام، موقع، وتواصل مباشر.",
    lang: "ar",
    dir: "rtl",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#10130f",
    theme_color: "#d4ff00",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
