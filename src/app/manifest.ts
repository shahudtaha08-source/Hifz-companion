import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hifz Companion",
    short_name: "Hifz Companion",
    description: "Offline-first Quran memorization, revision and Mutashabihat companion.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f6ef",
    theme_color: "#2f6b4f",
  };
}
