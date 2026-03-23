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

        <SegmentLayer segments={step.scene.segments} points={canvasPoints} />
        <PointLayer points={canvasPoints} />
        <LabelLayer points={canvasPoints} segments={step.scene.segments} />
      </svg>
    </div>
  );
}