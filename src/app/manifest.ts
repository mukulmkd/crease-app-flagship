import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_ICON_VERSION, APP_NAME } from "@/constants/app";
import { brandColors } from "@/constants/design-tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: brandColors.themeDark,
    theme_color: brandColors.themeLight,
    icons: [
      {
        src: `/icons/icon-192.png?v=${APP_ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512.png?v=${APP_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-maskable-512.png?v=${APP_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `/icons/apple-touch-icon.png?v=${APP_ICON_VERSION}`,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
