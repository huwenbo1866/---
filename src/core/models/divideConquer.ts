import type { Point } from "./geometry";

export type DCNodeStatus =
  | "idle"
  | "active"
  | "split"
  | "returned"
  | "right-summary"
  | "merging"
  | "resolved";

export interface DCLocalPoint extends Point {
  state?: "normal" | "strip" | "candidate" | "base" | "compare" | "best";
}

export interface DCResult {
  distance?: number;
  pair?: [string, string];
  label?: string;
}

export interface DCBand {
  leftX: number;
  rightX: number;
  label?: string;
}

export interface DCGuideLine {
  x: number;
  label: string;
  kind: "split" | "strip-bound";
}

export interface DCCompareSegment {
  from: string;
  to: string;
  label?: string;
  state?: "compare" | "best";
}

export interface DCRegionHighlight {
  side: "left" | "right";
  fill: string;
  opacity?: number;
}

export interface DCMiniScene {
  points: DCLocalPoint[];
  splitLineX?: number;
  guideLines?: DCGuideLine[];
  stripBand?: DCBand;
  regionHighlights?: DCRegionHighlight[];
  compareSegments?: DCCompareSegment[];
  result?: DCResult;
}

export interface DCTreeNode {
  id: string;
  parentId?: string;

  title: string;

  depth: number;
  range: [number, number];
  pointIds: string[];

  layoutX: number;
  layoutY: number;
  width: number;
  height: number;

  status: DCNodeStatus;
  isSummaryNode?: boolean;
  opacity?: number;

  miniScene: DCMiniScene;
}

export interface DCTreeEdge {
  id: string;
  from: string;
  to: string;
}

export interface DCCameraState {
  centerX: number;
  centerY: number;
  scale: number;
}

export type DCStepType =
  | "dc-root-show"
  | "dc-split"
  | "dc-children-drop"
  | "dc-children-retract"
  | "dc-left-focus"
  | "dc-left-return"
  | "dc-right-summary-fade-in"
  | "dc-merge-back-strip-ready"
  | "dc-strip-candidates"
  | "dc-strip-outer-enter"
  | "dc-strip-compare"
  | "dc-parent-resolved";

export interface DCStepMeta {
  stepType: DCStepType;
  title: string;
  description: string;
  depth?: number;
  range?: [number, number];
  leftDistance?: number;
  rightDistance?: number;
  mergedDistance?: number;

  // strip（带状区域）扫描过程用的额外字段
  i?: number;
  j?: number;
  currentDistance?: number;
  bestDistance?: number;
  bestPair?: [string, string];
  comparisonCount?: number;
  totalComparisons?: number;
}

export interface DCTreeScene {
  nodes: DCTreeNode[];
  edges: DCTreeEdge[];
  camera?: DCCameraState;
}

export interface DCTreeStep {
  id: string;
  scene: DCTreeScene;
  meta: DCStepMeta;
}