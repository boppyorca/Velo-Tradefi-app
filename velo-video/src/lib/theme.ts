export const C = {
  bg: "#0A0A0C",
  surface: "#141418",
  elevated: "#1E1E26",
  lime: "#A3E635",
  indigo: "#6366F1",
  purple: "#8B5CF6",
  amber: "#F59E0B",
  red: "#F05252",
  text: "#F0F0F0",
  textSecondary: "#8A8A9A",
  textMuted: "#4A4A5A",
  cyan: "#06B6D4",
  supabase: "#3ECF8E",
} as const;

export const SCENE_DURATION = 180;

export const springFast = { damping: 16, stiffness: 130 } as const;
export const springSmooth = { damping: 12, stiffness: 90 } as const;
export const springBouncy = { damping: 8, stiffness: 100, mass: 0.8 } as const;
