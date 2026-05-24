export const BUOY_COLORS = ['#0f766e', '#2563eb', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#be123c', '#4d7c0f'];

export function getBuoyColor(index: number) {
  return BUOY_COLORS[index % BUOY_COLORS.length];
}
