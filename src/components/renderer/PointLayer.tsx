import type { PointViewModel } from "../../core/models/visualization";

export interface CanvasPoint extends PointViewModel {
  canvasX: number;
  canvasY: number;
}

interface PointLayerProps {
  points: CanvasPoint[];
}

function getPointStyle(state: PointViewModel["state"]) {
  switch (state) {
    case "current-base":
      return { fill: "#f59e0b", stroke: "#b45309", radius: 10 };
    case "current-compare":
      return { fill: "#ef4444", stroke: "#991b1b", radius: 10 };
    case "best":
      return { fill: "#10b981", stroke: "#065f46", radius: 11 };
    case "muted":
      return { fill: "#94a3b8", stroke: "#64748b", radius: 8 };
    case "normal":
    default:
      return { fill: "#2563eb", stroke: "#1d4ed8", radius: 8 };
  }
}

export default function PointLayer({ points }: PointLayerProps) {
  return (
    <g>
      {points.map((point) => {
        const style = getPointStyle(point.state);
        const className = `point-circle point-circle--${point.state}`;

        return (
          <g key={point.id}>
            {point.isBase && (
              <>
                <circle
                  cx={point.canvasX}
                  cy={point.canvasY}
                  r={style.radius + 9}
                  fill="#f59e0b"
                  opacity="0.16"
                  className="point-base-halo"
                >
                  <animate
                    attributeName="r"
                    values={`${style.radius + 7};${style.radius + 13};${style.radius + 7}`}
                    dur="1.15s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.08;0.28;0.08"
                    dur="1.15s"
                    repeatCount="indefinite"
                  />
                </circle>

                <circle
                  cx={point.canvasX}
                  cy={point.canvasY}
                  r={style.radius + 5}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  className="point-base-ring"
                />
              </>
            )}

            <circle
              cx={point.canvasX}
              cy={point.canvasY}
              r={style.radius}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={2}
              className={className}
            />
          </g>
        );
      })}
    </g>
  );
}