import type { Point } from "./geometry";

export type PointVisualState =
  | "normal"
  | "current-base"
  | "current-compare"
  | "best"
  | "muted";

export type SegmentVisualState =
  | "current-compare"
  | "best"
  | "helper";

export type BruteForceStepType =
  | "algorithm-start"
  | "outer-loop-enter"
  | "pair-compared"
  | "pair-finished"
  | "algorithm-finished"
  | "insufficient-points";

export interface PointViewModel extends Point {
  state: PointVisualState;
  isBase?: boolean; // 新增：是否是当前固定基准点
}

export interface SegmentViewModel {
  id: string;
  from: string;
  to: string;
  state: SegmentVisualState;
  dashed?: boolean;
  label?: string;
}

export interface StepMeta {
  stepType: BruteForceStepType;
  title: string;
  description: string;

  i?: number;
  j?: number;

  currentDistance?: number;
  bestDistance?: number;
  bestPair?: [string, string];

  comparisonCount?: number;
  totalComparisons?: number;
}

export interface VisualizationScene {
  points: PointViewModel[];
  segments: SegmentViewModel[];
  guideLines?: Array<{ x: number; label: string; kind: string }>;
  stripBand?: { leftX: number; rightX: number; label: string };
}

export interface VisualizationStep {
  id: string;
  scene: VisualizationScene;
  meta: StepMeta;
}