import type { Metadata, Viewport } from "next";
import { Geist_Mono, Oswald, Plus_Jakarta_Sans } from "next/font/google";

import { APP_DESCRIPTION, APP_ICON_VERSION, APP_NAME } from "@/constants/app";
import { brandColors } from "@/constants/design-tokens";
import { AppProviders } from "@/providers/app-providers";

import "@/styles/globals.css";

/** Modern Scorebook Utility — Plus Jakarta UI + Oswald display. */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: `/icons/icon-192.png?v=${APP_ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `/icons/icon-512.png?v=${APP_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `/icons/apple-touch-icon.png?v=${APP_ICON_VERSION}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brandColors.themeLight },
    { media: "(prefers-color-scheme: dark)", color: brandColors.themeDark },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Android Chrome: resize layout when the soft keyboard opens so fields stay visible.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${oswald.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
