"use client";

import { useEffect, type ReactNode } from "react";

type MobileKeyboardProviderProps = {
  children: ReactNode;
};

function isTextEditable(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    // Skip non-keyboard controls.
    return ![
      "button",
      "checkbox",
      "radio",
      "submit",
      "reset",
      "file",
      "image",
      "range",
      "color",
      "hidden",
    ].includes(type);
  }
  return el.getAttribute("role") === "textbox";
}

function scrollEditableIntoView(el: HTMLElement) {
  const vv = window.visualViewport;
  // Extra space above the keyboard / home indicator.
  const pad = 28;

  if (!vv) {
    el.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
    return;
  }

  const rect = el.getBoundingClientRect();
  const visibleTop = vv.offsetTop + pad;
  const visibleBottom = vv.offsetTop + vv.height - pad;

  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return;

  // Prefer centering in the remaining visible area so sheets/forms stay usable.
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
}

/**
 * Mobile soft-keyboard UX for the installable PWA:
 * - Keep focused fields above the keyboard (visualViewport)
 * - Dismiss the keyboard when tapping outside editable controls
 */
function MobileKeyboardProvider({ children }: MobileKeyboardProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarse =
      window.matchMedia?.("(pointer: coarse)").matches ||
      window.matchMedia?.("(hover: none)").matches;
    if (!coarse) return;

    let focusTimer: number | null = null;
    let viewportTimer: number | null = null;

    const scheduleScroll = (el: HTMLElement, delayMs: number) => {
      if (focusTimer != null) window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => {
        scrollEditableIntoView(el);
        // Second pass after the keyboard animation settles (iOS/Android).
        viewportTimer = window.setTimeout(() => {
          if (document.activeElement === el) scrollEditableIntoView(el);
        }, 280);
      }, delayMs);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isTextEditable(event.target)) return;
      scheduleScroll(event.target, 50);
    };

    const onViewportChange = () => {
      const active = document.activeElement;
      if (!isTextEditable(active)) return;
      scheduleScroll(active, 16);
    };

    const onPointerDown = (event: PointerEvent) => {
      const active = document.activeElement;
      if (!isTextEditable(active)) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      // Keep keyboard if the tap is still on an editable control (or its label).
      if (target instanceof Element) {
        const editable = target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        );
        if (editable) return;

        const label = target.closest("label");
        if (label) {
          const forId = label.getAttribute("for");
          if (forId && document.getElementById(forId) === active) return;
          if (label.contains(active)) return;
        }
      }

      if (active.contains(target)) return;
      active.blur();
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown, true);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", onViewportChange);
    vv?.addEventListener("scroll", onViewportChange);

    return () => {
      if (focusTimer != null) window.clearTimeout(focusTimer);
      if (viewportTimer != null) window.clearTimeout(viewportTimer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown, true);
      vv?.removeEventListener("resize", onViewportChange);
      vv?.removeEventListener("scroll", onViewportChange);
    };
  }, []);

  return children;
}

export { MobileKeyboardProvider };
