export function generateFallbackId(index: number): string {
  return `UNKNOWN_${Date.now()}_${index}`;
}
