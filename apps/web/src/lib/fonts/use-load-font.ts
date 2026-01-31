import { useEffect, useRef } from "react";
import { getGoogleFontUrl } from "./google-fonts";

// Cache of loaded fonts to avoid duplicate loads
const loadedFonts = new Set<string>();

/**
 * Hook to dynamically load a Google Font
 * Returns true when the font is loaded and ready to use
 */
export function useLoadFont(fontFamily: string | null): boolean {
  const isLoaded = fontFamily ? loadedFonts.has(fontFamily) : true;

  useEffect(() => {
    if (!fontFamily || loadedFonts.has(fontFamily)) {
      return;
    }

    loadFont(fontFamily);
  }, [fontFamily]);

  return isLoaded;
}

/**
 * Load a Google Font by injecting a link element
 */
export function loadFont(fontFamily: string): void {
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Mark as loaded immediately to prevent duplicate loads
  loadedFonts.add(fontFamily);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = getGoogleFontUrl(fontFamily);
  link.dataset.fontFamily = fontFamily;

  document.head.appendChild(link);
}

/**
 * Preload multiple fonts (useful for font picker preview)
 */
export function preloadFonts(fontFamilies: string[]): void {
  for (const family of fontFamilies) {
    loadFont(family);
  }
}

/**
 * Check if a font is already loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

/**
 * Hook to preload fonts as they come into view (for virtualized lists)
 */
export function usePreloadFontOnVisible(
  fontFamily: string,
  ref: React.RefObject<HTMLElement | null>
): void {
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasLoadedRef.current || loadedFonts.has(fontFamily)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadFont(fontFamily);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [fontFamily, ref]);
}
