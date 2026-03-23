import type { SegmentViewModel } from "../../core/models/visualization";
import type { CanvasPoint } from "./PointLayer";

interface SegmentLayerProps {
  segments: SegmentViewModel[];
  points: CanvasPoint[];
}

function getSegmentStyle(state: SegmentViewModel["state"]) {
  switch (state) {
    case "best":
      return {
        stroke: "#059669",
        strokeWidth: 4,
        dashArray: undefined as string | undefined,
      };
    case "helper":
      return {
        stroke: "#94a3b8",
        strokeWidth: 2,
        dashArray: "4 4",
      };
    case "current-compare":
    default:
      return {
        stroke: "#f97316",
        strokeWidth: 3,
        dashArray: "8 6",
      };
  }
}

export default function SegmentLayer({
  segments,
  points,
}: SegmentLayerProps) {
  const pointMap = new Map(points.map((point) => [point.id, point]));

  return (
    <g>
      {segments.map((segment) => {
        const from = pointMap.get(segment.from);
        const to = pointMap.get(segment.to);

        if (!from || !to) return null;

        const style = getSegmentStyle(segment.state);

        return (
          <line
            key={segment.id}
            x1={from.canvasX}
            y1={from.canvasY}
            x2={to.canvasX}
            y2={to.canvasY}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeDasharray={segment.dashed ? style.dashArray : undefined}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}