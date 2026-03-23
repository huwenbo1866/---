import type { VisualizationStep } from "../../core/models/visualization";

interface StepInfoPanelProps {
  step: VisualizationStep | null;
}

function formatDistance(value?: number) {
  return value === undefined ? "—" : value.toFixed(2);
}

function formatPair(pair?: [string, string]) {
  return pair ? `${pair[0]} , ${pair[1]}` : "—";
}

export default function StepInfoPanel({ step }: StepInfoPanelProps) {
  if (!step) {
    return <aside className="info-panel">当前没有步骤信息。</aside>;
  }

  const { meta } = step;

  return (
    <aside className="info-panel">
      <div className="info-panel-header">
        <div className="info-panel-tag">{meta.stepType}</div>
        <h2>{meta.title}</h2>
        <p>{meta.description}</p>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <span>外层索引 i</span>
          <strong>{meta.i ?? "—"}</strong>
        </div>
        <div className="info-item">
          <span>内层索引 j</span>
          <strong>{meta.j ?? "—"}</strong>
        </div>
        <div className="info-item">
          <span>当前距离</span>
          <strong>{formatDistance(meta.currentDistance)}</strong>
        </div>
        <div className="info-item">
          <span>当前最优距离</span>
          <strong>{formatDistance(meta.bestDistance)}</strong>
        </div>
        <div className="info-item">
          <span>当前最优点对</span>
          <strong>{formatPair(meta.bestPair)}</strong>
        </div>
        <div className="info-item">
          <span>已完成比较次数</span>
          <strong>
            {meta.comparisonCount ?? 0} / {meta.totalComparisons ?? 0}
          </strong>
        </div>
      </div>
    </aside>
  );
}