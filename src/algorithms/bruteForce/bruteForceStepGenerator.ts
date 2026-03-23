import type { Point, Pair } from "../../core/models/geometry";
import { isSamePair, pairKey } from "../../core/models/geometry";
import type {
  PointViewModel,
  SegmentViewModel,
  VisualizationScene,
  VisualizationStep,
} from "../../core/models/visualization";
import type { BruteForceConfig } from "./bruteForceTypes";

function calcDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatDistance(value: number): string {
  return value.toFixed(2);
}

function totalPairCount(n: number): number {
  return n < 2 ? 0 : (n * (n - 1)) / 2;
}

function createBasePointViewModels(points: Point[]): PointViewModel[] {
  return points.map((point) => ({
    ...point,
    state: "normal",
  }));
}

interface BuildSceneOptions {
  basePointId?: string;
  comparePair?: Pair | null;
  bestPair?: Pair | null;
  currentDistance?: number;
}

function buildScene(points: Point[], options: BuildSceneOptions = {}): VisualizationScene {
  const pointMap = new Map<string, PointViewModel>();
  const pointViewModels = createBasePointViewModels(points);

  for (const point of pointViewModels) {
    pointMap.set(point.id, point);
  }

  const segments: SegmentViewModel[] = [];

  // 1. 先记录“谁是基准点”
  if (options.basePointId && pointMap.has(options.basePointId)) {
    const basePoint = pointMap.get(options.basePointId)!;
    basePoint.isBase = true;
    basePoint.state = "current-base";
  }

  // 2. 当前比较点对可以覆盖颜色状态，但不能抹掉 isBase
  if (options.comparePair) {
    const { a, b } = options.comparePair;

    if (pointMap.has(a)) pointMap.get(a)!.state = "current-compare";
    if (pointMap.has(b)) pointMap.get(b)!.state = "current-compare";

    segments.push({
      id: `compare-${pairKey(a, b)}`,
      from: a,
      to: b,
      state: "current-compare",
      dashed: true,
      label:
        options.currentDistance !== undefined
          ? `dist = ${formatDistance(options.currentDistance)}`
          : undefined,
    });
  }

  // 3. 当前最优点对也可以覆盖颜色状态，但不能抹掉 isBase
  if (options.bestPair) {
    const { a, b } = options.bestPair;

    if (pointMap.has(a)) pointMap.get(a)!.state = "best";
    if (pointMap.has(b)) pointMap.get(b)!.state = "best";

    segments.push({
      id: `best-${pairKey(a, b)}`,
      from: a,
      to: b,
      state: "best",
      dashed: false,
      label: "best",
    });
  }

  return {
    points: Array.from(pointMap.values()),
    segments,
  };
}

export function generateBruteForceSteps(config: BruteForceConfig): VisualizationStep[] {
  const { points } = config;
  const steps: VisualizationStep[] = [];

  const totalComparisons = totalPairCount(points.length);

  let stepId = 0;
  let comparisonCount = 0;

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPair: Pair | null = null;

  const pushStep = (step: Omit<VisualizationStep, "id">) => {
    steps.push({
      id: `step-${stepId++}`,
      ...step,
    });
  };

  if (points.length < 2) {
    pushStep({
      scene: buildScene(points),
      meta: {
        stepType: "insufficient-points",
        title: "点数量不足",
        description: "至少需要两个点才能执行最近点对的蛮力比较。",
        comparisonCount: 0,
        totalComparisons: 0,
      },
    });

    return steps;
  }

  pushStep({
    scene: buildScene(points),
    meta: {
      stepType: "algorithm-start",
      title: "开始执行蛮力法",
      description: "点集已给定，算法开始按照双重循环枚举所有点对。",
      comparisonCount: 0,
      totalComparisons,
    },
  });

  for (let i = 0; i < points.length - 1; i++) {
    const pi = points[i];

    pushStep({
      scene: buildScene(points, {
        basePointId: pi.id,
        bestPair,
      }),
      meta: {
        stepType: "outer-loop-enter",
        title: `固定基准点 ${pi.label ?? pi.id}`,
        description: `进入外层循环 i = ${i}，固定 ${pi.label ?? pi.id}，准备与其后所有点逐一比较。`,
        i,
        bestDistance: Number.isFinite(bestDistance) ? bestDistance : undefined,
        bestPair: bestPair ? [bestPair.a, bestPair.b] : undefined,
        comparisonCount,
        totalComparisons,
      },
    });

    for (let j = i + 1; j < points.length; j++) {
      const pj = points[j];
      const currentPair: Pair = { a: pi.id, b: pj.id };
      const currentDistance = calcDistance(pi, pj);

      const oldBestDistance = bestDistance;
      const oldBestPair = bestPair;

      comparisonCount += 1;
      const isBetter = currentDistance < bestDistance;

      pushStep({
        scene: buildScene(points, {
          basePointId: pi.id,
          comparePair: currentPair,
          bestPair: oldBestPair,
          currentDistance,
        }),
        meta: {
          stepType: "pair-compared",
          title: "比较当前点对",
          description: !Number.isFinite(oldBestDistance)
            ? `比较 ${pi.label ?? pi.id} 与 ${pj.label ?? pj.id}，距离为 ${formatDistance(currentDistance)}。这是第一组被比较的点对。`
            : isBetter
            ? `比较 ${pi.label ?? pi.id} 与 ${pj.label ?? pj.id}，距离为 ${formatDistance(currentDistance)}，优于当前最优值 ${formatDistance(oldBestDistance)}。`
            : `比较 ${pi.label ?? pi.id} 与 ${pj.label ?? pj.id}，距离为 ${formatDistance(currentDistance)}，不优于当前最优值 ${formatDistance(oldBestDistance)}。`,
          i,
          j,
          currentDistance,
          bestDistance: Number.isFinite(oldBestDistance) ? oldBestDistance : undefined,
          bestPair: oldBestPair ? [oldBestPair.a, oldBestPair.b] : undefined,
          comparisonCount,
          totalComparisons,
        },
      });

      if (isBetter) {
        bestDistance = currentDistance;
        bestPair = currentPair;
      }

      pushStep({
        scene: buildScene(points, {
          basePointId: pi.id,
          bestPair,
        }),
        meta: {
          stepType: "pair-finished",
          title: isBetter ? "更新当前最优结果" : "当前点对处理结束",
          description: isBetter
            ? `${pi.label ?? pi.id} 与 ${pj.label ?? pj.id} 成为新的最近点对，当前最短距离为 ${formatDistance(bestDistance)}。`
            : `本次比较结束，当前最近点对保持不变。`,
          i,
          j,
          currentDistance,
          bestDistance: Number.isFinite(bestDistance) ? bestDistance : undefined,
          bestPair: bestPair ? [bestPair.a, bestPair.b] : undefined,
          comparisonCount,
          totalComparisons,
        },
      });
    }
  }

  pushStep({
    scene: buildScene(points, {
      bestPair,
    }),
    meta: {
      stepType: "algorithm-finished",
      title: "蛮力法执行完成",
      description: bestPair
        ? `所有点对均已比较完毕，最终最近点对为 ${bestPair.a} 与 ${bestPair.b}，最短距离为 ${formatDistance(bestDistance)}。`
        : "算法执行完成，但没有找到有效点对。",
      bestDistance: Number.isFinite(bestDistance) ? bestDistance : undefined,
      bestPair: bestPair ? [bestPair.a, bestPair.b] : undefined,
      comparisonCount,
      totalComparisons,
    },
  });

  return steps;
}