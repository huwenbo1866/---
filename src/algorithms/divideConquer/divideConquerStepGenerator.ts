import type { Point } from "../../core/models/geometry";
import type {
  DCBand,
  DCCameraState,
  DCCompareSegment,
  DCGuideLine,
  DCLocalPoint,
  DCMiniScene,
  DCRegionHighlight,
  DCResult,
  DCTreeEdge,
  DCTreeNode,
  DCTreeStep,
} from "../../core/models/divideConquer";
import type { DivideConquerConfig } from "./divideConquerTypes";

interface SolveResult {
  distance: number;
  pair?: [string, string];
}

interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function sortByX(points: Point[]): Point[] {
  return [...points].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.y !== b.y) return a.y - b.y;
    return a.id.localeCompare(b.id);
  });
}

function sortByY(points: Point[]): Point[] {
  return [...points].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.id.localeCompare(b.id);
  });
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatDistance(value?: number): string {
  return value === undefined || !Number.isFinite(value) ? "∞" : value.toFixed(2);
}

function bruteForce(points: Point[]): SolveResult {
  if (points.length < 2) {
    return { distance: Number.POSITIVE_INFINITY };
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPair: [string, string] | undefined;

  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = dist(points[i], points[j]);
      if (d < bestDistance) {
        bestDistance = d;
        bestPair = [points[i].id, points[j].id];
      }
    }
  }

  return { distance: bestDistance, pair: bestPair };
}

function betterResult(a: SolveResult, b: SolveResult): SolveResult {
  return a.distance <= b.distance ? a : b;
}

function exactSolve(pointsInput: Point[]): SolveResult {
  const points = sortByX(pointsInput);

  if (points.length <= 3) {
    return bruteForce(points);
  }

  const mid = Math.floor(points.length / 2);
  const left = points.slice(0, mid);
  const right = points.slice(mid);
  const midX = points[mid].x;

  const leftRes = exactSolve(left);
  const rightRes = exactSolve(right);

  let best = betterResult(leftRes, rightRes);
  const byY = sortByY(points);
  const strip = byY.filter((point) => Math.abs(point.x - midX) < best.distance);

  for (let i = 0; i < strip.length; i++) {
    for (let j = i + 1; j < strip.length && j <= i + 7; j++) {
      if (strip[j].y - strip[i].y >= best.distance) break;

      const d = dist(strip[i], strip[j]);
      if (d < best.distance) {
        best = {
          distance: d,
          pair: [strip[i].id, strip[j].id],
        };
      }
    }
  }

  return best;
}

function cloneResult(result?: DCResult): DCResult | undefined {
  if (!result) return undefined;
  return {
    distance: result.distance,
    pair: result.pair ? [...result.pair] as [string, string] : undefined,
    label: result.label,
  };
}

function cloneBand(band?: DCBand): DCBand | undefined {
  if (!band) return undefined;
  return {
    leftX: band.leftX,
    rightX: band.rightX,
    label: band.label,
  };
}

function cloneGuideLines(lines?: DCGuideLine[]): DCGuideLine[] | undefined {
  if (!lines) return undefined;
  return lines.map((line) => ({ ...line }));
}

function cloneCompareSegments(
  segments?: DCCompareSegment[]
): DCCompareSegment[] | undefined {
  if (!segments) return undefined;
  return segments.map((segment) => ({ ...segment }));
}

function cloneRegionHighlights(
  highlights?: DCRegionHighlight[]
): DCRegionHighlight[] | undefined {
  if (!highlights) return undefined;
  return highlights.map((highlight) => ({ ...highlight }));
}

function clonePoints(points: DCLocalPoint[]): DCLocalPoint[] {
  return points.map((point) => ({ ...point }));
}

function cloneMiniScene(scene: DCMiniScene): DCMiniScene {
  return {
    points: clonePoints(scene.points),
    splitLineX: scene.splitLineX,
    guideLines: cloneGuideLines(scene.guideLines),
    stripBand: cloneBand(scene.stripBand),
    regionHighlights: cloneRegionHighlights(scene.regionHighlights),
    compareSegments: cloneCompareSegments(scene.compareSegments),
    result: cloneResult(scene.result),
  };
}

function cloneNode(node: DCTreeNode): DCTreeNode {
  return {
    ...node,
    range: [...node.range] as [number, number],
    pointIds: [...node.pointIds],
    miniScene: cloneMiniScene(node.miniScene),
  };
}

function cloneEdge(edge: DCTreeEdge): DCTreeEdge {
  return { ...edge };
}

function buildPointStates(params: {
  points: Point[];
  stripIds?: Set<string>;
  comparePair?: [string, string];
  bestPair?: [string, string];
}): DCLocalPoint[] {
  return params.points.map((point) => {
    let state: DCLocalPoint["state"] = "normal";

    if (params.stripIds?.has(point.id)) {
      state = "strip";
    }
    if (params.comparePair?.includes(point.id)) {
      state = "compare";
    }
    if (params.bestPair?.includes(point.id)) {
      state = "best";
    }

    return {
      ...point,
      state,
    };
  });
}

function makeResult(
  distance?: number,
  pair?: [string, string],
  label?: string
): DCResult | undefined {
  if (distance === undefined || !Number.isFinite(distance)) return undefined;
  return { distance, pair, label };
}

function makeSegment(
  pair?: [string, string],
  label?: string,
  state: "compare" | "best" = "best"
): DCCompareSegment[] | undefined {
  if (!pair) return undefined;
  return [
    {
      from: pair[0],
      to: pair[1],
      label,
      state,
    },
  ];
}

function nodeSizeFor(
  pointCount: number,
  kind: "root" | "child" | "merge",
  depth: number
): { width: number; height: number } {
  if (kind === "root") {
    return {
      width: pointCount >= 18 ? 520 : 460,
      height: pointCount >= 18 ? 240 : 220,
    };
  }

  if (kind === "merge") {
    return {
      width: pointCount >= 10 ? 360 : 320,
      height: pointCount >= 10 ? 185 : 165,
    };
  }

  return {
    width: pointCount >= 8 ? 320 : 280,
    height: pointCount >= 8 ? 165 : 145,
  };
}

function rootLayout(pointCount: number): LayoutBox {
  const size = nodeSizeFor(pointCount, "root", 0);
  return {
    x: 760,
    y: 120,
    width: size.width,
    height: size.height,
  };
}

function expandedChildLayout(
  parent: LayoutBox,
  depth: number,
  side: "left" | "right",
  pointCount: number
): LayoutBox {
  const size = nodeSizeFor(pointCount, "child", depth);
  const gapX = Math.max(190, 285 - depth * 34);
  const gapY = 220;

  return {
    x: parent.x + (side === "left" ? -gapX : gapX),
    y: parent.y + gapY,
    width: size.width,
    height: size.height,
  };
}

function hiddenChildLayout(
  parent: LayoutBox,
  side: "left" | "right",
  pointCount: number
): LayoutBox {
  const size = nodeSizeFor(pointCount, "child", 0);
  return {
    x: parent.x + (side === "left" ? -parent.width * 0.18 : parent.width * 0.18),
    y: parent.y + 10,
    width: size.width * 0.7,
    height: size.height * 0.7,
  };
}

function buildNode(params: {
  id: string;
  parentId?: string;
  title: string;
  depth: number;
  range: [number, number];
  points: Point[];
  layout: LayoutBox;
  status: DCTreeNode["status"];
  opacity?: number;
  isSummaryNode?: boolean;
  miniScene: DCMiniScene;
}): DCTreeNode {
  return {
    id: params.id,
    parentId: params.parentId,
    title: params.title,
    depth: params.depth,
    range: params.range,
    pointIds: params.points.map((p) => p.id),
    layoutX: params.layout.x,
    layoutY: params.layout.y,
    width: params.layout.width,
    height: params.layout.height,
    status: params.status,
    opacity: params.opacity ?? 1,
    isSummaryNode: params.isSummaryNode,
    miniScene: params.miniScene,
  };
}

function buildSplitScene(points: Point[], midX: number): DCMiniScene {
  return {
    points: buildPointStates({ points }),
    splitLineX: midX,
    guideLines: [{ x: midX, label: "L", kind: "split" }],
    regionHighlights: [
      { side: "left", fill: "#bfdbfe", opacity: 0.32 },
      { side: "right", fill: "#ddd6fe", opacity: 0.28 },
    ],
  };
}

function buildResolvedScene(points: Point[], result: SolveResult): DCMiniScene {
  return {
    points: buildPointStates({
      points,
      bestPair: result.pair,
    }),
    compareSegments: makeSegment(result.pair, "best", "best"),
    result: makeResult(result.distance, result.pair, `d=${formatDistance(result.distance)}`),
  };
}

function buildMergeReadyScene(params: {
  points: Point[];
  midX: number;
  leftRes: SolveResult;
  rightRes: SolveResult;
  d: number;
}): DCMiniScene {
  const compareSegments: DCCompareSegment[] = [];

  if (params.leftRes.pair) {
    compareSegments.push({
      from: params.leftRes.pair[0],
      to: params.leftRes.pair[1],
      label: "dL",
      state: "best",
    });
  }

  if (params.rightRes.pair) {
    compareSegments.push({
      from: params.rightRes.pair[0],
      to: params.rightRes.pair[1],
      label: "dR",
      state: "best",
    });
  }

  return {
    points: buildPointStates({ points: params.points }),
    splitLineX: params.midX,
    guideLines: [
      { x: params.midX, label: "L", kind: "split" },
      { x: params.midX - params.d, label: "L-d", kind: "strip-bound" },
      { x: params.midX + params.d, label: "L+d", kind: "strip-bound" },
    ],
    stripBand: {
      leftX: params.midX - params.d,
      rightX: params.midX + params.d,
      label: `d=${formatDistance(params.d)}`,
    },
    regionHighlights: [
      { side: "left", fill: "#bbf7d0", opacity: 0.24 },
      { side: "right", fill: "#ddd6fe", opacity: 0.22 },
    ],
    compareSegments,
    result: makeResult(
      params.d,
      betterResult(params.leftRes, params.rightRes).pair,
      `d=${formatDistance(params.d)}`
    ),
  };
}

function buildStripCompareScene(params: {
  points: Point[];
  midX: number;
  stripIds: Set<string>;
  d: number;
  comparePair?: [string, string];
  bestPair?: [string, string];
  bestDistance?: number;
}): DCMiniScene {
  return {
    points: buildPointStates({
      points: params.points,
      stripIds: params.stripIds,
      comparePair: params.comparePair,
      bestPair: params.bestPair,
    }),
    splitLineX: params.midX,
    guideLines: [
      { x: params.midX, label: "L", kind: "split" },
      { x: params.midX - params.d, label: "L-d", kind: "strip-bound" },
      { x: params.midX + params.d, label: "L+d", kind: "strip-bound" },
    ],
    stripBand: {
      leftX: params.midX - params.d,
      rightX: params.midX + params.d,
      label: `d=${formatDistance(params.bestDistance ?? params.d)}`,
    },
    regionHighlights: [
      { side: "left", fill: "#bbf7d0", opacity: 0.18 },
      { side: "right", fill: "#ddd6fe", opacity: 0.16 },
    ],
    compareSegments: params.comparePair
      ? [
          {
            from: params.comparePair[0],
            to: params.comparePair[1],
            label:
              params.bestPair &&
              params.comparePair[0] === params.bestPair[0] &&
              params.comparePair[1] === params.bestPair[1]
                ? "best"
                : "cross",
            state:
              params.bestPair &&
              params.comparePair[0] === params.bestPair[0] &&
              params.comparePair[1] === params.bestPair[1]
                ? "best"
                : "compare",
          },
        ]
      : params.bestPair
      ? makeSegment(params.bestPair, "best", "best")
      : undefined,
    result: makeResult(
      params.bestDistance,
      params.bestPair,
      `d=${formatDistance(params.bestDistance)}`
    ),
  };
}

export function generateDivideConquerSteps(
  config: DivideConquerConfig
): DCTreeStep[] {
  const inputPoints = sortByX(config.points);
  const steps: DCTreeStep[] = [];

  let sceneNodes: DCTreeNode[] = [];
  let sceneEdges: DCTreeEdge[] = [];
  let sceneCamera: DCCameraState = {
    centerX: 760,
    centerY: 340,
    scale: 0.86,
  };

  let nodeCounter = 0;
  let stepCounter = 0;

  function nextNodeId(prefix: string) {
    return `${prefix}-${nodeCounter++}`;
  }

  function getNode(nodeId: string): DCTreeNode {
    const node = sceneNodes.find((item) => item.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    return node;
  }

  function upsertNode(node: DCTreeNode) {
    const index = sceneNodes.findIndex((item) => item.id === node.id);
    if (index >= 0) {
      sceneNodes[index] = node;
    } else {
      sceneNodes.push(node);
    }
  }

  function upsertEdge(edge: DCTreeEdge) {
    const index = sceneEdges.findIndex((item) => item.id === edge.id);
    if (index >= 0) {
      sceneEdges[index] = edge;
    } else {
      sceneEdges.push(edge);
    }
  }

  function removeDescendants(nodeId: string) {
    const childIds = new Set<string>();

    function collect(parentId: string) {
      for (const node of sceneNodes) {
        if (node.parentId === parentId) {
          childIds.add(node.id);
          collect(node.id);
        }
      }
    }

    collect(nodeId);

    sceneNodes = sceneNodes.filter((node) => !childIds.has(node.id));
    sceneEdges = sceneEdges.filter(
      (edge) => !childIds.has(edge.from) && !childIds.has(edge.to)
    );
  }

  function setCamera(camera: DCCameraState) {
    sceneCamera = camera;
  }

  function cameraForNodes(nodeIds: string[], scale: number): DCCameraState {
    const nodes = nodeIds.map(getNode);
    const minX = Math.min(...nodes.map((n) => n.layoutX - n.width / 2));
    const maxX = Math.max(...nodes.map((n) => n.layoutX + n.width / 2));
    const minY = Math.min(...nodes.map((n) => n.layoutY - n.height / 2));
    const maxY = Math.max(...nodes.map((n) => n.layoutY + n.height / 2));

    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      scale,
    };
  }

  function snapshotScene() {
    return {
      nodes: sceneNodes.map(cloneNode),
      edges: sceneEdges.map(cloneEdge),
      camera: { ...sceneCamera },
    };
  }

  function pushStep(meta: DCTreeStep["meta"]) {
    steps.push({
      id: `dc-step-${stepCounter++}`,
      scene: snapshotScene(),
      meta,
    });
  }

  function solveDisplay(params: {
    nodeId: string;
    points: Point[];
    range: [number, number];
    depth: number;
  }): SolveResult {
    const { nodeId, points, range, depth } = params;
    const node = getNode(nodeId);
    const sortedX = sortByX(points);

    if (sortedX.length <= 3) {
      const result = bruteForce(sortedX);

      upsertNode({
        ...node,
        status: "resolved",
        miniScene: buildResolvedScene(sortedX, result),
      });

      setCamera(cameraForNodes([nodeId], Math.min(1.34, 1.08 + depth * 0.10)));

      pushStep({
        stepType: "dc-left-return",
        title: "到达基例并直接求解",
        description: `当前子问题点数为 ${sortedX.length}，直接比较得到最近点对并返回。`,
        depth,
        range,
        leftDistance: result.distance,
      });

      return result;
    }

    const mid = Math.floor(sortedX.length / 2);
    const leftPoints = sortedX.slice(0, mid);
    const rightPoints = sortedX.slice(mid);
    const midX = sortedX[mid].x;

    upsertNode({
      ...node,
      status: "split",
      miniScene: buildSplitScene(sortedX, midX),
    });

    setCamera(depth === 0 ? cameraForNodes([nodeId], 0.98) : cameraForNodes([nodeId], 1.0));

    pushStep({
      stepType: "dc-split",
      title: "当前节点按 x 坐标划分左右子问题",
      description: `当前节点按中线 L = ${midX} 划分为左右两部分。`,
      depth,
      range,
    });

    const leftNodeId = nextNodeId(`left-d${depth + 1}`);
    const rightNodeId = nextNodeId(`right-d${depth + 1}`);

    const parentLayout: LayoutBox = {
      x: node.layoutX,
      y: node.layoutY,
      width: node.width,
      height: node.height,
    };

    const leftRange: [number, number] = [range[0], range[0] + leftPoints.length];
    const rightRange: [number, number] = [range[0] + leftPoints.length, range[1]];

    upsertNode(
      buildNode({
        id: leftNodeId,
        parentId: nodeId,
        title: "左子问题 S_L",
        depth: depth + 1,
        range: leftRange,
        points: leftPoints,
        layout: hiddenChildLayout(parentLayout, "left", leftPoints.length),
        status: "idle",
        opacity: 0.1,
        miniScene: {
          points: buildPointStates({ points: leftPoints }),
        },
      })
    );

    upsertNode(
      buildNode({
        id: rightNodeId,
        parentId: nodeId,
        title: "右子问题 S_R",
        depth: depth + 1,
        range: rightRange,
        points: rightPoints,
        layout: hiddenChildLayout(parentLayout, "right", rightPoints.length),
        status: "idle",
        opacity: 0.18,
        isSummaryNode: true,
        miniScene: {
          points: buildPointStates({ points: rightPoints }),
        },
      })
    );

    upsertEdge({
      id: `${nodeId}-${leftNodeId}`,
      from: nodeId,
      to: leftNodeId,
    });
    upsertEdge({
      id: `${nodeId}-${rightNodeId}`,
      from: nodeId,
      to: rightNodeId,
    });

    upsertNode({
      ...getNode(leftNodeId),
      layoutX: expandedChildLayout(parentLayout, depth, "left", leftPoints.length).x,
      layoutY: expandedChildLayout(parentLayout, depth, "left", leftPoints.length).y,
      width: expandedChildLayout(parentLayout, depth, "left", leftPoints.length).width,
      height: expandedChildLayout(parentLayout, depth, "left", leftPoints.length).height,
      status: "active",
      opacity: 1,
    });

    upsertNode({
      ...getNode(rightNodeId),
      layoutX: expandedChildLayout(parentLayout, depth, "right", rightPoints.length).x,
      layoutY: expandedChildLayout(parentLayout, depth, "right", rightPoints.length).y,
      width: expandedChildLayout(parentLayout, depth, "right", rightPoints.length).width,
      height: expandedChildLayout(parentLayout, depth, "right", rightPoints.length).height,
      status: "idle",
      opacity: 0.58,
    });

    setCamera(
      cameraForNodes(
        [nodeId, leftNodeId, rightNodeId],
        depth === 0 ? 0.88 : 0.98
      )
    );

    pushStep({
      stepType: "dc-children-drop",
      title: "左右子问题从父节点动态展开",
      description: "父子三个节点整体居中展示，此时不单独偏向左子树。",
      depth: depth + 1,
      range: leftRange,
    });

    setCamera(cameraForNodes([leftNodeId], Math.min(1.36, 1.12 + depth * 0.08)));

    pushStep({
      stepType: "dc-left-focus",
      title: "镜头聚焦左子问题并继续递归",
      description: "镜头放大并聚焦左子问题，继续展开左侧递归。",
      depth: depth + 1,
      range: leftRange,
    });

    const leftRes = solveDisplay({
      nodeId: leftNodeId,
      points: leftPoints,
      range: leftRange,
      depth: depth + 1,
    });

    const rightRes = exactSolve(rightPoints);

    upsertNode({
      ...getNode(rightNodeId),
      status: "right-summary",
      opacity: 0.92,
      isSummaryNode: true,
      miniScene: buildResolvedScene(rightPoints, rightRes),
    });

    setCamera(cameraForNodes([nodeId, leftNodeId, rightNodeId], depth === 0 ? 0.90 : 0.98));

    pushStep({
      stepType: "dc-right-summary-fade-in",
      title: "右子树结果摘要淡入",
      description: "右子树不再重复展开中间过程，直接给出结果摘要。",
      depth: depth + 1,
      range: rightRange,
      leftDistance: leftRes.distance,
      rightDistance: rightRes.distance,
    });

    const baseBest = betterResult(leftRes, rightRes);

    removeDescendants(nodeId);

    upsertNode({
      ...getNode(nodeId),
      status: "merging",
      width: Math.max(getNode(nodeId).width, nodeSizeFor(sortedX.length, "merge", depth).width),
      height: Math.max(getNode(nodeId).height, nodeSizeFor(sortedX.length, "merge", depth).height),
      miniScene: buildMergeReadyScene({
        points: sortedX,
        midX,
        leftRes,
        rightRes,
        d: baseBest.distance,
      }),
    });

    setCamera(cameraForNodes([nodeId], depth === 0 ? 1.06 : 1.14));

    pushStep({
      stepType: "dc-merge-back-strip-ready",
      title: "子问题结果回收到父节点并准备 strip 合并",
      description: "左右子卡片在这一刻被移除，父节点内部直接接管左右结果并进入 strip 准备。",
      depth,
      range,
      leftDistance: leftRes.distance,
      rightDistance: rightRes.distance,
      mergedDistance: baseBest.distance,
    });

    let best = baseBest;
    const byY = sortByY(sortedX);
    const strip = byY.filter((point) => Math.abs(point.x - midX) < baseBest.distance);
    const stripIds = new Set(strip.map((point) => point.id));

    for (let i = 0; i < strip.length; i++) {
      for (let j = i + 1; j < strip.length && j <= i + 7; j++) {
        if (strip[j].y - strip[i].y >= best.distance) break;

        const currentPair: [string, string] = [strip[i].id, strip[j].id];
        const currentDistance = dist(strip[i], strip[j]);

        if (currentDistance < best.distance) {
          best = {
            distance: currentDistance,
            pair: currentPair,
          };
        }

        upsertNode({
          ...getNode(nodeId),
          status: "merging",
          miniScene: buildStripCompareScene({
            points: sortedX,
            midX,
            stripIds,
            d: baseBest.distance,
            comparePair: currentPair,
            bestPair: best.pair,
            bestDistance: best.distance,
          }),
        });

        setCamera(cameraForNodes([nodeId], depth === 0 ? 1.14 : 1.22));

        pushStep({
          stepType: "dc-strip-compare",
          title: "在 strip 中按 y 序执行双重循环比较",
          description:
            currentDistance < baseBest.distance && best.pair === currentPair
              ? `按 y 序双重循环比较 strip 候选点对，${currentPair[0]} 与 ${currentPair[1]} 产生了更优解。`
              : `按 y 序双重循环比较 strip 候选点对，当前检查 ${currentPair[0]} 与 ${currentPair[1]}。`,
          depth,
          range,
          leftDistance: leftRes.distance,
          rightDistance: rightRes.distance,
          mergedDistance: best.distance,
        });
      }
    }

    upsertNode({
      ...getNode(nodeId),
      status: "resolved",
      miniScene: buildResolvedScene(sortedX, best),
    });

    setCamera(depth === 0 ? cameraForNodes([nodeId], 1.0) : cameraForNodes([nodeId], 1.08));

    pushStep({
      stepType: "dc-parent-resolved",
      title: depth === 0 ? "分治法执行完成" : "当前父节点完成合并并返回结果",
      description:
        depth === 0
          ? "根节点已完成左右分治、结果回收与 strip 检查，得到最终最近点对。"
          : "当前节点已完成左右结果合并和 strip 检查，并向上返回。",
      depth,
      range,
      leftDistance: leftRes.distance,
      rightDistance: rightRes.distance,
      mergedDistance: best.distance,
    });

    return best;
  }

  if (inputPoints.length === 0) return [];

  const rootId = nextNodeId("root");
  const rootBox = rootLayout(inputPoints.length);

  upsertNode(
    buildNode({
      id: rootId,
      title: `父问题 S[0,${inputPoints.length})`,
      depth: 0,
      range: [0, inputPoints.length],
      points: inputPoints,
      layout: rootBox,
      status: "active",
      miniScene: {
        points: buildPointStates({ points: inputPoints }),
      },
    })
  );

  setCamera(cameraForNodes([rootId], 0.96));

  pushStep({
    stepType: "dc-root-show",
    title: "显示原始点集",
    description: "从原始点集开始，准备按 x 坐标执行第一次分治划分。",
    depth: 0,
    range: [0, inputPoints.length],
  });

  solveDisplay({
    nodeId: rootId,
    points: inputPoints,
    range: [0, inputPoints.length],
    depth: 0,
  });

  return steps;
}