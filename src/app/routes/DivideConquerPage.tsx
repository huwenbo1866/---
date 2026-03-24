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
          { id: "P0",  label: "P0",  x: 44,  y: 236 },
          { id: "P1",  label: "P1",  x: 67,  y: 78  },
          { id: "P2",  label: "P2",  x: 89,  y: 168 },
          { id: "P3",  label: "P3",  x: 121, y: 246 },
          { id: "P4",  label: "P4",  x: 146, y: 118 },
          { id: "P5",  label: "P5",  x: 168, y: 214 },
          { id: "P6",  label: "P6",  x: 193, y: 94  },
          { id: "P7",  label: "P7",  x: 209, y: 150 },
          { id: "P8",  label: "P8",  x: 234, y: 236 },

          // 分割线附近：跨左右的更近点对（strip 会更新 d）
          { id: "P9",  label: "P9",  x: 254, y: 168 },
          { id: "P10", label: "P10", x: 263, y: 174 },

          { id: "P11", label: "P11", x: 279, y: 72  },
          { id: "P12", label: "P12", x: 307, y: 244 },
          { id: "P13", label: "P13", x: 329, y: 158 },
          { id: "P14", label: "P14", x: 353, y: 112 },
          { id: "P15", label: "P15", x: 386, y: 222 },
          { id: "P16", label: "P16", x: 405, y: 140 },
          { id: "P17", label: "P17", x: 441, y: 186 },
          { id: "P18", label: "P18", x: 463, y: 90  },
          { id: "P19", label: "P19", x: 488, y: 240 },
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

            {meta?.i !== undefined ? (
              <div className="info-item">
                <span>strip 外层 i</span>
                <strong>{meta.i}</strong>
              </div>
            ) : null}

            {meta?.j !== undefined ? (
              <div className="info-item">
                <span>strip 内层 j</span>
                <strong>{meta.j}</strong>
              </div>
            ) : null}

            {meta?.currentDistance !== undefined ? (
              <div className="info-item">
                <span>当前比较距离</span>
                <strong>{formatDistance(meta.currentDistance)}</strong>
              </div>
            ) : null}

            {meta?.comparisonCount !== undefined ? (
              <div className="info-item">
                <span>strip 比较进度</span>
                <strong>
                  {meta.comparisonCount} / {meta.totalComparisons ?? "—"}
                </strong>
              </div>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}