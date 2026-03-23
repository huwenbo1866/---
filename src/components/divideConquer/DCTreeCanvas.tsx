import type { DCTreeStep } from "../../core/models/divideConquer";
import DCEdgeLayer from "./DCEdgeLayer";
import DCNodeLayer from "./DCNodeLayer";
import DCOverlayLayer from "./DCOverlayLayer";

interface DCTreeCanvasProps {
  step: DCTreeStep | null;
  width?: number;
  height?: number;
}

export default function DCTreeCanvas({
  step,
  width = 1320,
  height = 860,
}: DCTreeCanvasProps) {
  if (!step) {
    return <div className="visualizer-empty">当前没有可显示的分治步骤。</div>;
  }

  const camera = step.scene.camera ?? {
    centerX: width / 2,
    centerY: height / 2,
    scale: 1,
  };

  const translateX = width / 2 - camera.centerX * camera.scale;
  const translateY = height / 2 - camera.centerY * camera.scale;

  return (
    <div className="visualizer-card dc-tree-card">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="visualizer-svg"
      >
        <rect x={0} y={0} width={width} height={height} rx={28} fill="#f8fafc" />

        <g
          className="dc-camera-group"
          style={{
            transformOrigin: "0 0",
            transform: `translate(${translateX}px, ${translateY}px) scale(${camera.scale})`,
          }}
        >
          <DCEdgeLayer nodes={step.scene.nodes} edges={step.scene.edges} />
          <DCNodeLayer nodes={step.scene.nodes} />
        </g>

        <DCOverlayLayer width={width} height={height} />
      </svg>
    </div>
  );
}