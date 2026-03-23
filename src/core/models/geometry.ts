export interface Point {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface Pair {
  a: string;
  b: string;
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export function isSamePair(p1: Pair | null | undefined, p2: Pair | null | undefined): boolean {
  if (!p1 || !p2) return false;
  return pairKey(p1.a, p1.b) === pairKey(p2.a, p2.b);
}