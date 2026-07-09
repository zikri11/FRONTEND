// Shared "nested box" (kotak dalam kotak) layering — used on /dashboard and
// /servers so the surface treatment stays consistent across pages.
//
// Three dark-blue layers step up in lightness (page bg 0.129 → outer 0.158 →
// inner 0.185, hue 264.7 matching --background). Borders are a soft, low-
// contrast blue instead of harsh white, and inner boxes get a gentle drop
// shadow to lift them off the container. Light mode falls back to muted/card.

export const outerBoxClass =
  'space-y-4 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:p-5 ' +
  'dark:border-[oklch(0.24_0.03_264.7)] dark:bg-[oklch(0.158_0.038_264.7)]'

export const nestedCardClass =
  'bg-card shadow-sm dark:border-[oklch(0.27_0.03_264.7)] dark:bg-[oklch(0.185_0.036_264.7)] ' +
  'dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.4),0_4px_10px_-4px_rgba(0,0,0,0.35)]'
