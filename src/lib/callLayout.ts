import type { CSSProperties } from "react";

/**
 * Responsive grid classes for multi-participant video calls.
 * 2 → 2 columns | 3–4 → 2×2 | 5–6 → 3×2 | 7–9 → 3-column adaptive rows
 */
export function getRemoteGridClass(remoteCount: number): string {
  if (remoteCount <= 1) return "";

  if (remoteCount === 2) {
    return "grid h-full w-full grid-cols-2 grid-rows-1 gap-3 min-h-0";
  }

  if (remoteCount <= 4) {
    return "grid h-full w-full grid-cols-2 grid-rows-2 gap-3 min-h-0";
  }

  if (remoteCount <= 6) {
    return "grid h-full w-full grid-cols-3 grid-rows-2 gap-3 min-h-0";
  }

  return "grid h-full w-full grid-cols-3 gap-3 min-h-0";
}

export function getRemoteGridStyle(remoteCount: number): CSSProperties | undefined {
  if (remoteCount <= 6 || remoteCount <= 1) return undefined;
  const rows = Math.ceil(remoteCount / 3);
  return {
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
  };
}

export function isSingleRemoteLayout(remoteCount: number): boolean {
  return remoteCount === 1;
}
