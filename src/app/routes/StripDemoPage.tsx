import { useState, useMemo } from "react";
import PlayerControls from "../../components/controls/PlayerControls";
import VisualizerCanvas from "../../components/renderer/VisualizerCanvas";
import { useStepPlayer } from "../../core/player/useStepPlayer";
import type { Point } from "../../core/models/geometry";
import type { VisualizationStep, PointVisualState, SegmentVisualState, BruteForceStepType } from "../../core/models/visualization";

// 扩展 VisualizationScene 类型以支持带状区域边界
interface ExtendedVisualizationScene {
  points: Array<Point & { state: PointVisualState }>;
  segments: Array<{ id: string; from: string; to: string; label?: string; state: SegmentVisualState }>;
  stripBand?: { leftX: number; rightX: number; label: string };
  guideLines?: Array<{ x: number; label: string; kind: string }>;
}

// 生成演示点集
function generatePoints(caseType: "inside" | "outside"): Point[] {
  if (caseType === "inside") {
    // 最近点对在带状区域内的情况，带状区域内包含6个点（接近几何约束上限）
    return [
      { id: "P0", label: "P0", x: 50, y: 100 },
      { id: "P1", label: "P1", x: 70, y: 120 },
      { id: "P2", label: "P2", x: 90, y: 80 },
      // 带状区域内的点（x在100±25范围内）
      { id: "P3", label: "P3", x: 85, y: 110 },
      { id: "P4", label: "P4", x: 95, y: 100 },
      { id: "P5", label: "P5", x: 105, y: 95 },  // 与 P6 是最近点对
      { id: "P6", label: "P6", x: 115, y: 100 }, // 与 P5 是最近点对
      { id: "P7", label: "P7", x: 125, y: 115 },
      { id: "P8", label: "P8", x: 135, y: 90 },
      // 带状区域外的点
      { id: "P9", label: "P9", x: 150, y: 70 },
      { id: "P10", label: "P10", x: 170, y: 130 },
      { id: "P11", label: "P11", x: 190, y: 80 },
    ];
  } else {
    // 最近点对在带状区域外的情况，增加点数量，包含纵坐标差大于d的情况
    return [
      { id: "P0", label: "P0", x: 50, y: 100 },
      { id: "P1", label: "P1", x: 70, y: 120 }, // 与 P2 是最近点对
      { id: "P2", label: "P2", x: 80, y: 115 }, // 与 P1 是最近点对
      // 带状区域内的点（x在100±15范围内）
      { id: "P3", label: "P3", x: 90, y: 90 },
      { id: "P4", label: "P4", x: 95, y: 105 },
      { id: "P5", label: "P5", x: 100, y: 85 },
      { id: "P6", label: "P6", x: 105, y: 115 },
      { id: "P7", label: "P7", x: 110, y: 95 },
      { id: "P8", label: "P8", x: 115, y: 125 }, // 纵坐标差大于d的点
      // 带状区域外的点
      { id: "P9", label: "P9", x: 130, y: 75 }, // 与 P10 是最近点对
      { id: "P10", label: "P10", x: 140, y: 80 }, // 与 P9 是最近点对
      { id: "P11", label: "P11", x: 160, y: 130 },
      { id: "P12", label: "P12", x: 180, y: 90 },
    ];
  }
}

// 生成演示步骤
function generateStripDemoSteps(caseType: "inside" | "outside"): VisualizationStep[] {
  const points = generatePoints(caseType);
  const steps: VisualizationStep[] = [];
  
  // 步骤1：显示原始点集
  steps.push({
    id: "step-1",
    scene: {
      points: points.map(p => ({ ...p, state: "normal" as PointVisualState })),
      segments: [],
    },
    meta: {
      stepType: "algorithm-start" as BruteForceStepType,
      title: "原始点集",
      description: "展示平面上的点集，准备执行分治法。",
    },
  });
  
  // 步骤2：分割点集
  const midX = 100; // 分割线位置
  steps.push({
    id: "step-2",
    scene: {
      points: points.map(p => ({
        ...p,
        state: p.x <= midX ? "current-base" as PointVisualState : "muted" as PointVisualState,
      })),
      segments: [],
      guideLines: [{
        x: midX,
        label: "L",
        kind: "split",
      }],
    },
    meta: {
      stepType: "outer-loop-enter" as BruteForceStepType,
      title: "分割点集",
      description: `按分割线 L = ${midX} 将点集分为左右两部分。左半部分包含 x ≤ ${midX} 的点，右半部分包含 x > ${midX} 的点。`,
    },
  });
  
  // 步骤3：计算左右子问题的最近点对
  let leftDist = 0, rightDist = 0;
  let leftPair: [string, string] | undefined;
  let rightPair: [string, string] | undefined;
  
  if (caseType === "inside") {
    // 左右子问题的最近点对距离较大
    leftDist = 22.36; // P1-P3
    rightDist = 25.00; // P9-P11
    leftPair = ["P1", "P3"];
    rightPair = ["P9", "P11"];
  } else {
    // 左右子问题的最近点对距离较小
    leftDist = 11.18; // P1-P2
    rightDist = 11.18; // P7-P8
    leftPair = ["P1", "P2"];
    rightPair = ["P7", "P8"];
  }
  
  const d = Math.min(leftDist, rightDist);
  
  const segments = [];
  if (leftPair) {
    segments.push({
      id: `segment-${leftPair[0]}-${leftPair[1]}`,
      from: leftPair[0],
      to: leftPair[1],
      label: `dL=${leftDist.toFixed(2)}`,
      state: "helper" as SegmentVisualState,
    });
  }
  if (rightPair) {
    segments.push({
      id: `segment-${rightPair[0]}-${rightPair[1]}`,
      from: rightPair[0],
      to: rightPair[1],
      label: `dR=${rightDist.toFixed(2)}`,
      state: "helper" as SegmentVisualState,
    });
  }
  
  steps.push({
    id: "step-3",
    scene: {
      points: points.map(p => {
        let state: PointVisualState = "normal";
        if (leftPair?.includes(p.id) || rightPair?.includes(p.id)) state = "best";
        return { ...p, state };
      }),
      segments,
      guideLines: [{
        x: midX,
        label: "L",
        kind: "split",
      }],
    },
    meta: {
      stepType: "pair-compared" as BruteForceStepType,
      title: "求解子问题",
      description: `左子问题最近距离 dL = ${leftDist.toFixed(2)}，右子问题最近距离 dR = ${rightDist.toFixed(2)}，取 d = ${d.toFixed(2)}。这是当前已知的最小距离。`,
    },
  });
  
  // 步骤4：构建带状区域
  const stripLeftX = midX - d;
  const stripRightX = midX + d;
  const stripPoints = points.filter(p => Math.abs(p.x - midX) <= d);
  const stripPointIds = new Set(stripPoints.map(p => p.id));
  
  steps.push({
    id: "step-4",
    scene: {
      points: points.map(p => ({
        ...p,
        state: stripPointIds.has(p.id) ? "current-compare" as PointVisualState : "muted" as PointVisualState,
      })),
      segments,
      guideLines: [
        { x: midX, label: "L", kind: "split" },
        { x: stripLeftX, label: "L-d", kind: "strip-bound" },
        { x: stripRightX, label: "L+d", kind: "strip-bound" },
      ],
      stripBand: {
        leftX: stripLeftX,
        rightX: stripRightX,
        label: `d=${d.toFixed(2)}`,
      },
    },
    meta: {
      stepType: "outer-loop-enter" as BruteForceStepType,
      title: "构建带状区域",
      description: `在分割线两侧扩展 d = ${d.toFixed(2)}，构建宽度为 2d 的带状区域，包含 ${stripPoints.length} 个点。这些点是可能形成跨分割线最近点对的候选点。`,
    },
  });
  
  // 步骤5：按y排序带状区域内的点
  const sortedStripPoints = [...stripPoints].sort((a, b) => a.y - b.y);
  steps.push({
    id: "step-5",
    scene: {
      points: points.map(p => {
        let state: PointVisualState = "normal";
        if (stripPointIds.has(p.id)) state = "current-base" as PointVisualState;
        return { ...p, state };
      }),
      segments,
      guideLines: [
        { x: midX, label: "L", kind: "split" },
        { x: stripLeftX, label: "L-d", kind: "strip-bound" },
        { x: stripRightX, label: "L+d", kind: "strip-bound" },
      ],
      stripBand: {
        leftX: stripLeftX,
        rightX: stripRightX,
        label: `d=${d.toFixed(2)}`,
      },
    },
    meta: {
      stepType: "outer-loop-enter" as BruteForceStepType,
      title: "按y坐标排序",
      description: `将带状区域内的点按 y 坐标排序，排序后的顺序为：${sortedStripPoints.map(p => p.label).join(', ')}。这样每个点只需检查后续点，且可以通过y坐标差剪枝。`,
    },
  });
  
  // 步骤6：线性时间检查带状区域内的点对（详细展示每个比较步骤）
  let bestDist = d;
  let bestPair: [string, string] | undefined;
  
  if (caseType === "inside") {
    // 最近点对在带状区域内
    bestDist = 14.14; // P5-P6
    bestPair = ["P5", "P6"];
  } else {
    // 最近点对在带状区域外
    bestDist = d; // 保持左右子问题的最小距离
    bestPair = leftPair; // 使用左子问题的最近点对
  }
  
  // 详细展示线性时间检查过程
  let currentCheckStep = 6;
  for (let i = 0; i < sortedStripPoints.length; i++) {
    const basePoint = sortedStripPoints[i];
    
    // 显示当前基准点
    steps.push({
      id: `step-${currentCheckStep++}`,
      scene: {
        points: points.map(p => {
          let state: PointVisualState = "normal";
          if (p.id === basePoint.id) state = "current-base" as PointVisualState;
          else if (stripPointIds.has(p.id)) state = "current-compare" as PointVisualState;
          if (bestPair?.includes(p.id)) state = "best" as PointVisualState;
          return { ...p, state };
        }),
        segments,
        guideLines: [
          { x: midX, label: "L", kind: "split" },
          { x: stripLeftX, label: "L-d", kind: "strip-bound" },
          { x: stripRightX, label: "L+d", kind: "strip-bound" },
        ],
        stripBand: {
          leftX: stripLeftX,
          rightX: stripRightX,
          label: `d=${d.toFixed(2)}`,
        },
      },
      meta: {
        stepType: "outer-loop-enter" as BruteForceStepType,
        title: `检查基准点 ${basePoint.label}`,
        description: `当前基准点为 ${basePoint.label}，接下来检查其后续点，直到y坐标差超过d。`,
      },
    });
    
    // 检查后续点
    let checkCount = 0;
    let hasYDiffExceeded = false;
    for (let j = i + 1; j < sortedStripPoints.length; j++) {
      const comparePoint = sortedStripPoints[j];
      
      // 计算y坐标差
      const yDiff = comparePoint.y - basePoint.y;
      if (yDiff >= d) {
        // y坐标差超过d，停止检查，添加醒目提醒
        hasYDiffExceeded = true;
        steps.push({
          id: `step-${currentCheckStep++}`,
          scene: {
            points: points.map(p => {
              let state: PointVisualState = "normal";
              if (p.id === basePoint.id) state = "current-base" as PointVisualState;
              else if (p.id === comparePoint.id) state = "error" as PointVisualState; // 醒目显示
              else if (stripPointIds.has(p.id)) state = "muted" as PointVisualState;
              if (bestPair?.includes(p.id)) state = "best" as PointVisualState;
              return { ...p, state };
            }),
            segments: [
              ...segments,
              bestPair ? {
                id: `segment-${bestPair[0]}-${bestPair[1]}`,
                from: bestPair[0],
                to: bestPair[1],
                label: `best=${bestDist.toFixed(2)}`,
                state: "best" as SegmentVisualState,
              } : null,
            ].filter(Boolean),
            guideLines: [
              { x: midX, label: "L", kind: "split" },
              { x: stripLeftX, label: "L-d", kind: "strip-bound" },
              { x: stripRightX, label: "L+d", kind: "strip-bound" },
            ],
            stripBand: {
              leftX: stripLeftX,
              rightX: stripRightX,
              label: `d=${d.toFixed(2)}`,
            },
          },
          meta: {
            stepType: "pair-compared" as BruteForceStepType,
            title: `y坐标差超过d，停止检查`,
            description: `点 ${comparePoint.label} 与 ${basePoint.label} 的y坐标差为 ${yDiff.toFixed(2)} ≥ d = ${d.toFixed(2)}，停止检查后续点。这是剪枝优化的关键步骤！`,
          },
        });
        break;
      }
      
      checkCount++;
      
      // 显示当前比较的点对
      const currentDist = Math.sqrt((basePoint.x - comparePoint.x) ** 2 + (basePoint.y - comparePoint.y) ** 2);
      const isBest = currentDist < bestDist;
      
      if (isBest) {
        bestDist = currentDist;
        bestPair = [basePoint.id, comparePoint.id];
      }
      
      steps.push({
        id: `step-${currentCheckStep++}`,
        scene: {
          points: points.map(p => {
            let state: PointVisualState = "normal";
            if (p.id === basePoint.id) state = "current-base" as PointVisualState;
            else if (p.id === comparePoint.id) state = "current-compare" as PointVisualState;
            else if (stripPointIds.has(p.id)) state = "muted" as PointVisualState;
            if (bestPair?.includes(p.id)) state = "best" as PointVisualState;
            return { ...p, state };
          }),
          segments: [
            ...segments,
            {
              id: `segment-${basePoint.id}-${comparePoint.id}`,
              from: basePoint.id,
              to: comparePoint.id,
              label: `dist=${currentDist.toFixed(2)}`,
              state: isBest ? "best" as SegmentVisualState : "helper" as SegmentVisualState,
            },
          ],
          guideLines: [
            { x: midX, label: "L", kind: "split" },
            { x: stripLeftX, label: "L-d", kind: "strip-bound" },
            { x: stripRightX, label: "L+d", kind: "strip-bound" },
          ],
          stripBand: {
            leftX: stripLeftX,
            rightX: stripRightX,
            label: `d=${d.toFixed(2)}`,
          },
        },
        meta: {
          stepType: "pair-compared" as BruteForceStepType,
          title: `比较点对 ${basePoint.label}-${comparePoint.label}`,
          description: `比较点对 ${basePoint.label}-${comparePoint.label}，距离为 ${currentDist.toFixed(2)}${isBest ? "，找到更优解！" : "。"}`,
        },
      });
    }
    
    // 如果所有后续点的y坐标差都小于d，添加完成提示
    if (!hasYDiffExceeded && i < sortedStripPoints.length - 1) {
      steps.push({
        id: `step-${currentCheckStep++}`,
        scene: {
          points: points.map(p => {
            let state: PointVisualState = "normal";
            if (p.id === basePoint.id) state = "current-base" as PointVisualState;
            else if (stripPointIds.has(p.id)) state = "current-compare" as PointVisualState;
            if (bestPair?.includes(p.id)) state = "best" as PointVisualState;
            return { ...p, state };
          }),
          segments: [
            ...segments,
            bestPair ? {
              id: `segment-${bestPair[0]}-${bestPair[1]}`,
              from: bestPair[0],
              to: bestPair[1],
              label: `best=${bestDist.toFixed(2)}`,
              state: "best" as SegmentVisualState,
            } : null,
          ].filter(Boolean),
          guideLines: [
            { x: midX, label: "L", kind: "split" },
            { x: stripLeftX, label: "L-d", kind: "strip-bound" },
            { x: stripRightX, label: "L+d", kind: "strip-bound" },
          ],
          stripBand: {
            leftX: stripLeftX,
            rightX: stripRightX,
            label: `d=${d.toFixed(2)}`,
          },
        },
        meta: {
          stepType: "pair-compared" as BruteForceStepType,
          title: `所有后续点检查完成`,
          description: `已检查完 ${basePoint.label} 的所有后续点，没有点的y坐标差超过d。`,
        },
      });
    }
    
    // 显示当前基准点检查完成
    steps.push({
      id: `step-${currentCheckStep++}`,
      scene: {
        points: points.map(p => {
          let state: PointVisualState = "normal";
          if (stripPointIds.has(p.id)) state = "current-compare" as PointVisualState;
          if (bestPair?.includes(p.id)) state = "best" as PointVisualState;
          return { ...p, state };
        }),
        segments: bestPair ? [{
          id: `segment-${bestPair[0]}-${bestPair[1]}`,
          from: bestPair[0],
          to: bestPair[1],
          label: `best=${bestDist.toFixed(2)}`,
          state: "best" as SegmentVisualState,
        }] : [],
        guideLines: [
          { x: midX, label: "L", kind: "split" },
          { x: stripLeftX, label: "L-d", kind: "strip-bound" },
          { x: stripRightX, label: "L+d", kind: "strip-bound" },
        ],
        stripBand: {
          leftX: stripLeftX,
          rightX: stripRightX,
          label: `d=${d.toFixed(2)}`,
        },
      },
      meta: {
        stepType: "pair-compared" as BruteForceStepType,
        title: `基准点 ${basePoint.label} 检查完成`,
        description: `基准点 ${basePoint.label} 共检查了 ${checkCount} 个后续点，未超过6个。这是因为在d×2d的矩形内最多包含6个点。`,
      },
    });
  }
  
  // 步骤7：展示结果
  steps.push({
    id: `step-${currentCheckStep}`,
    scene: {
      points: points.map(p => ({
        ...p,
        state: bestPair?.includes(p.id) ? "best" as PointVisualState : "normal" as PointVisualState,
      })),
      segments: bestPair ? [{
        id: `segment-${bestPair[0]}-${bestPair[1]}`,
        from: bestPair[0],
        to: bestPair[1],
        label: `最短距离=${bestDist.toFixed(2)}`,
        state: "best" as SegmentVisualState,
      }] : [],
    },
    meta: {
      stepType: "algorithm-finished" as BruteForceStepType,
      title: "最终结果",
      description: caseType === "inside"
        ? `最近点对 (${bestPair?.[0]}, ${bestPair?.[1]}) 在带状区域内，距离为 ${bestDist.toFixed(2)}。带状区域处理的时间复杂度为O(n)，因此整个分治法的时间复杂度为O(n log n)。`
        : `最近点对 (${bestPair?.[0]}, ${bestPair?.[1]}) 在带状区域外，距离为 ${bestDist.toFixed(2)}。带状区域处理的时间复杂度为O(n)，因此整个分治法的时间复杂度为O(n log n)。`,
    },
  });
  
  return steps;
}

export default function StripDemoPage() {
  const [caseType, setCaseType] = useState<"inside" | "outside"> ("inside");
  const [showProof, setShowProof] = useState(true);
  
  const steps = useMemo(() => generateStripDemoSteps(caseType), [caseType]);
  const player = useStepPlayer(steps, { autoPlayIntervalMs: 1500 });
  const meta = player.currentStep?.meta;
  
  return (
    <main className="page-main">
      {showProof ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>为什么每个点最多检查6个后续点？</h2>
          <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
            <div style={{ flex: 1, maxWidth: "500px" }}>
              <svg width="400" height="300" viewBox="0 0 400 300">
                {/* 绘制d×2d的矩形 */}
                <rect x="50" y="50" width="100" height="200" fill="#bfdbfe" opacity="0.3" stroke="#3b82f6" strokeWidth="2" />
                
                {/* 绘制分割线 */}
                <line x1="100" y1="50" x2="100" y2="250" stroke="#ef4444" strokeWidth="2" />
                
                {/* 绘制6个小正方形 */}
                <rect x="50" y="50" width="50" height="50" fill="none" stroke="#9ca3af" strokeWidth="1" />
                <rect x="100" y="50" width="50" height="50" fill="none" stroke="#9ca3af" strokeWidth="1" />
                <rect x="50" y="100" width="50" height="50" fill="none" stroke="#9ca3af" strokeWidth="1" />
                <rect x="100" y="100" width="50" height="50" fill="none" stroke="#9ca3af" strokeWidth="1" />
                <rect x="50" y="150" width="50" height="50" fill="none" stroke="#9ca3af" strokeWidth="1" />
                <rect x="100" y="150" width="50" height="50" fill="none" stroke="#9ca3af" strokeWidth="1" />
                
                {/* 绘制6个点 */}
                <circle cx="75" cy="75" r="4" fill="#ef4444" />
                <circle cx="125" cy="75" r="4" fill="#ef4444" />
                <circle cx="75" cy="125" r="4" fill="#ef4444" />
                <circle cx="125" cy="125" r="4" fill="#ef4444" />
                <circle cx="75" cy="175" r="4" fill="#ef4444" />
                <circle cx="125" cy="175" r="4" fill="#ef4444" />
                
                {/* 标注 */}
                <text x="150" y="150" fill="#3b82f6" fontSize="14">d</text>
                <text x="100" y="30" fill="#ef4444" fontSize="14">L</text>
                <text x="20" y="150" fill="#3b82f6" fontSize="14">2d</text>
                <text x="200" y="150" fill="#1f2937" fontSize="14">每个小正方形边长为 d/2</text>
                <text x="200" y="170" fill="#1f2937" fontSize="14">每个小正方形最多一个点</text>
                <text x="200" y="190" fill="#1f2937" fontSize="14">否则距离小于 d</text>
              </svg>
            </div>
            <div style={{ flex: 1, maxWidth: "500px", textAlign: "left", padding: "0 20px" }}>
              <h3>几何证明：</h3>
              <ol style={{ lineHeight: "1.8" }}>
                <li>在宽度为 2d 的带状区域中，与点 p 距离小于 d 的点 q 必定位于一个 d×2d 的矩形内。</li>
                <li>将该矩形等分为 6 个 d/2 × d/2 的小正方形。</li>
                <li>每个小正方形内最多只能有一个点，否则两点之间的距离小于 d，与 d 是左右子问题最小距离的定义矛盾。</li>
                <li>因此，该矩形内最多包含 6 个点，每个点最多只需检查 6 个后续点。</li>
                <li>总检查次数为 O(n)，因此带状区域处理的时间复杂度为线性。</li>
              </ol>
            </div>
          </div>
          <button
            onClick={() => setShowProof(false)}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            进入演示
          </button>
        </div>
      ) : (
        <>
          <section className="visualizer-section">
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <button
                onClick={() => setCaseType("inside")}
                style={{
                  backgroundColor: caseType === "inside" ? "#10b981" : "#2563eb",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                最近点对在带状区域内
              </button>
              <button
                onClick={() => setCaseType("outside")}
                style={{
                  backgroundColor: caseType === "outside" ? "#10b981" : "#2563eb",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                最近点对在带状区域外
              </button>
            </div>
            
            <VisualizerCanvas step={player.currentStep} />
            <PlayerControls
              currentIndex={player.currentIndex}
              totalSteps={player.totalSteps}
              canPrev={player.canPrev}
              canNext={player.canNext}
              isPlaying={player.isPlaying}
              onPrev={player.prev}
              onNext={player.next}
              onReset={player.reset}
              onTogglePlay={player.togglePlay}
            />
          </section>
          
          <aside className="info-panel">
            <div className="info-panel-header">
              <div className="info-panel-tag">{meta?.stepType ?? "—"}</div>
              <h2>{meta?.title ?? "当前没有步骤"}</h2>
              <p>{meta?.description ?? "—"}</p>
            </div>
            
            <div className="info-panel-section">
              <h3>线性时间复杂度原理</h3>
              <ul>
                <li><strong>几何约束</strong>：在宽度为 2d 的带状区域中，与点 p 距离小于 d 的点 q 必定位于一个 d×2d 的矩形内。</li>
                <li><strong>最多 6 个点</strong>：该矩形内最多包含 6 个点，否则会存在更近的点对，与 d 的定义矛盾。</li>
                <li><strong>线性时间</strong>：每个点最多只需检查 6 个后续点，总检查次数为 O(n)，时间复杂度线性。</li>
                <li><strong>剪枝优化</strong>：当 y 坐标差超过 d 时停止检查，进一步减少计算量。</li>
              </ul>
            </div>
            
            <div className="info-panel-section">
              <h3>演示说明</h3>
              <ul>
                <li>点击按钮切换两种情况：最近点对在带状区域内或外。</li>
                <li>使用播放器控制按钮查看演示步骤。</li>
                <li>观察带状区域的构建和线性时间检查过程。</li>
              </ul>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
