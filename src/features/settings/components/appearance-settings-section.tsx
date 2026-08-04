"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { BodySm, Overline } from "@/components/common/typography";
import { FormField } from "@/components/forms/form-field";
import { SegmentedControl } from "@/components/forms/segmented-control";

type ThemeChoice = "system" | "light" | "dark";

const emptySubscribe = () => () => undefined;

function AppearanceSettingsSection() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const themeValue = (mounted ? (theme ?? "system") : "system") as ThemeChoice;

  return (
    <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
      <Overline className="text-muted-foreground">Appearance</Overline>
      <FormField
        label="Theme"
        description="System follows your device light/dark setting"
      >
        <SegmentedControl
          aria-label="Theme"
          size="sm"
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          value={themeValue}
          onValueChange={setTheme}
        />
      </FormField>
      <div className="flex items-center gap-2 text-muted-foreground">
        {themeValue === "system" ? (
          <Monitor className="size-4" aria-hidden />
        ) : themeValue === "dark" ? (
          <Moon className="size-4" aria-hidden />
        ) : (
          <Sun className="size-4" aria-hidden />
        )}
        <BodySm>
          {themeValue === "system"
            ? "Matches OS preference"
            : themeValue === "dark"
              ? "Clubhouse dark"
              : "Scorebook light"}
        </BodySm>
      </div>
    </section>
  );
}

export { AppearanceSettingsSection };
