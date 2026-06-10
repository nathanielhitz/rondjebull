export const TARGETS = [20, 19, 18, 17, 16, 15, "BULL"] as const;
export type Target = (typeof TARGETS)[number];
