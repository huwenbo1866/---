import type { VisualizationStep } from "../../core/models/visualization";
import LabelLayer from "./LabelLayer";
import PointLayer, { type CanvasPoint } from "./PointLayer";
import SegmentLayer from "./SegmentLayer";

interface VisualizerCanvasProps {
  step: VisualizationStep | null;
  width?: number;
  height?: number;
}

function projectPoints(
  step: VisualizationStep,
  width: number,
  height: number,
  padding: number
): CanvasPoint[] {
  const { points } = step.scene;

  if (points.length === 0) return [];

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  return points.map((point) => ({
    ...point,
    canvasX: padding + ((point.x - minX) / xRange) * usableWidth,
    canvasY: height - padding - ((point.y - minY) / yRange) * usableHeight,
  }));
}

export default function VisualizerCanvas({
  step,
  width = 780,
  height = 520,
}: VisualizerCanvasProps) {
  if (!step) {
    return <div className="visualizer-empty">当前没有可显示的步骤。</div>;
  }

  const padding = 56;
  const canvasPoints = projectPoints(step, width, height, padding);

  // 计算坐标范围，用于将实际坐标转换为画布坐标
  const xs = canvasPoints.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const xRange = maxX - minX || 1;
  const usableWidth = width - padding;
  const xScale = usableWidth / xRange;

  // 辅助函数：将实际x坐标转换为画布x坐标
  const xToCanvas = (x: number) => padding / 2 + ((x - minX) / xRange) * usableWidth;

  return (
    <div className="visualizer-card">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="visualizer-svg"
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={20}
          fill="#f8fafc"
        />

        <rect
          x={padding / 2}
          y={padding / 2}
          width={width - padding}
          height={height - padding}
          rx={16}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={2}
        />

        {/* 渲染分割线 */}
        {step.scene.guideLines && step.scene.guideLines.map((line, index) => {
          const canvasX = xToCanvas(line.x);
          return (
            <g key={index}>
              <line
                x1={canvasX}
                y1={padding / 2}
                x2={canvasX}
                y2={height - padding / 2}
                stroke={line.kind === "split" ? "#ef4444" : "#3b82f6"}
                strokeWidth={2}
                strokeDasharray={line.kind === "split" ? "0" : "5,5"}
              />
              <text
                x={canvasX}
                y={padding / 2 - 10}
                textAnchor="middle"
                fill={line.kind === "split" ? "#ef4444" : "#3b82f6"}
                fontSize="12"
                fontWeight="bold"
              >
                {line.label}
              </text>
            </g>
          );
        })}

        {/* 渲染带状区域 */}
        {step.scene.stripBand && (
          <rect
            x={xToCanvas(step.scene.stripBand.leftX)}
            y={padding / 2}
            width={xToCanvas(step.scene.stripBand.rightX) - xToCanvas(step.scene.stripBand.leftX)}
            height={height - padding}
            fill="#bfdbfe"
            opacity={0.3}
          />
        )}

        <SegmentLayer segments={step.scene.segments} points={canvasPoints} />
        <PointLayer points={canvasPoints} />
        <LabelLayer points={canvasPoints} segments={step.scene.segments} />
      </svg>
    </div>
  );
}