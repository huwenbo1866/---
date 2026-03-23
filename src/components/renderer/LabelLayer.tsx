import type { SegmentViewModel } from "../../core/models/visualization";
import type { CanvasPoint } from "./PointLayer";

interface LabelLayerProps {
  points: CanvasPoint[];
  segments: SegmentViewModel[];
}

export default function LabelLayer({ points, segments }: LabelLayerProps) {
  const pointMap = new Map(points.map((point) => [point.id, point]));

  return (
    <g>
      {points.map((point) => (
        <text
          key={`label-${point.id}`}
          x={point.canvasX}
          y={point.canvasY - 16}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="#0f172a"
        >
          {point.label ?? point.id}
        </text>
      ))}

      {segments.map((segment) => {
        if (!segment.label) return null;

        const from = pointMap.get(segment.from);
        const to = pointMap.get(segment.to);

        if (!from || !to) return null;

        const midX = (from.canvasX + to.canvasX) / 2;
        const midY = (from.canvasY + to.canvasY) / 2;

        return (
          <g key={`segment-label-${segment.id}`}>
            <rect
              x={midX - 42}
              y={midY - 28}
              width={84}
              height={24}
              rx={8}
              fill="white"
              stroke="#cbd5e1"
            />
            <text
              x={midX}
              y={midY - 12}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#334155"
            >
              {segment.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}