"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";

import { brandColors } from "@/constants/design-tokens";

type ThemeProviderProps = {
  children: ReactNode;
};

function ResolvedThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    const color =
      resolvedTheme === "dark" ? brandColors.themeDark : brandColors.themeLight;

    // Next's viewport metadata remains the SSR-safe system fallback. Once
    // next-themes resolves the saved in-app choice, make every theme-color
    // declaration reflect that actual choice (including "system").
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = color;
        meta.removeAttribute("media");
      });
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="crease-theme"
      disableTransitionOnChange
    >
      <ResolvedThemeColor />
      {children}
    </NextThemesProvider>
  );
}
