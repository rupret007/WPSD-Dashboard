import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WPSD Dashboard",
    short_name: "WPSD",
    description: "Quick TG and hotspot control for W0CHP Digital Voice",
    start_url: "/quick",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#1e293b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
