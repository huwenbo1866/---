import { useMemo } from "react";
import PlayerControls from "../../components/controls/PlayerControls";
import DCTreeCanvas from "../../components/divideConquer/DCTreeCanvas";
import { useStepPlayer } from "../../core/player/useStepPlayer";
import { generateDivideConquerSteps } from "../../algorithms/divideConquer/divideConquerStepGenerator";

function formatDistance(value?: number) {
  return value === undefined ? "—" : value.toFixed(2);
}

export default function DivideConquerPage() {
  const steps = useMemo(
    () =>
      generateDivideConquerSteps({
        points: [
          { id: "P0", label: "P0", x: 40, y: 350 },
          { id: "P1", label: "P1", x: 62, y: 120 },
          { id: "P2", label: "P2", x: 78, y: 260 },
          { id: "P3", label: "P3", x: 95, y: 80 },
          { id: "P4", label: "P4", x: 118, y: 200 },
          { id: "P5", label: "P5", x: 142, y: 310 },
          { id: "P6", label: "P6", x: 168, y: 140 },
          { id: "P7", label: "P7", x: 189, y: 240 },
          { id: "P8", label: "P8", x: 214, y: 100 },
          { id: "P9", label: "P9", x: 238, y: 182 },
          { id: "P10", label: "P10", x: 262, y: 188 },
          { id: "P11", label: "P11", x: 286, y: 330 },
          { id: "P12", label: "P12", x: 305, y: 130 },
          { id: "P13", label: "P13", x: 326, y: 235 },
          { id: "P14", label: "P14", x: 344, y: 92 },
          { id: "P15", label: "P15", x: 368, y: 285 },
          { id: "P16", label: "P16", x: 392, y: 160 },
          { id: "P17", label: "P17", x: 416, y: 245 },
          { id: "P18", label: "P18", x: 438, y: 110 },
          { id: "P19", label: "P19", x: 462, y: 350 },
        ],
      }),
    []
  );

  const player = useStepPlayer(steps, {
    autoPlayIntervalMs: 1800,
  });

  const meta = player.currentStep?.meta;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1>分治法执行过程可视化</h1>
          <p>
            父节点常驻，左子树详细展开，右子树摘要显示，子问题结果回收到父节点后执行 strip 合并。
          </p>
        </div>
      </header>

      <main className="page-main">
        <section className="visualizer-section">
          <DCTreeCanvas step={player.currentStep} />
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

          <div className="info-grid">
            <div className="info-item">
              <span>递归深度</span>
              <strong>{meta?.depth ?? "—"}</strong>
            </div>
            <div className="info-item">
              <span>当前区间</span>
              <strong>
                {meta?.range ? `[${meta.range[0]}, ${meta.range[1]})` : "—"}
              </strong>
            </div>
            <div className="info-item">
              <span>左结果 dL</span>
              <strong>{formatDistance(meta?.leftDistance)}</strong>
            </div>
            <div className="info-item">
              <span>右结果 dR</span>
              <strong>{formatDistance(meta?.rightDistance)}</strong>
            </div>
            <div className="info-item">
              <span>合并距离 d</span>
              <strong>{formatDistance(meta?.mergedDistance)}</strong>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}