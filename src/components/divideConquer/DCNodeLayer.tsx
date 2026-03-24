import type {
  DCCompareSegment,
  DCGuideLine,
  DCLocalPoint,
  DCRegionHighlight,
  DCTreeNode,
} from "../../core/models/divideConquer";

interface DCNodeLayerProps {
  nodes: DCTreeNode[];
}

interface ProjectedPoint extends DCLocalPoint {
  canvasX: number;
  canvasY: number;
}

function getNodeCardClassName(node: DCTreeNode) {
  const classes = ["dc-node-card"];

  if (node.status === "active") classes.push("dc-node-card--active");
  if (node.status === "split") classes.push("dc-node-card--split");
  if (node.status === "returned") classes.push("dc-node-card--returned");
  if (node.status === "right-summary") classes.push("dc-node-card--summary");
  if (node.status === "merging") classes.push("dc-node-card--merging");
  if (node.status === "resolved") classes.push("dc-node-card--resolved");

  return classes.join(" ");
}

function getLocalPointStyle(state?: DCLocalPoint["state"]) {
  switch (state) {
    case "strip":
      return { fill: "#fbbf24", stroke: "#d97706", radius: 6.4 };
    case "candidate":
      return { fill: "#f59e0b", stroke: "#b45309", radius: 6.9 };
    case "base":
      return { fill: "#f97316", stroke: "#c2410c", radius: 7.2 };
    case "compare":
      return { fill: "#ef4444", stroke: "#b91c1c", radius: 7.2 };
    case "best":
      return { fill: "#10b981", stroke: "#047857", radius: 7.2 };
    case "normal":
    default:
      return { fill: "#2563eb", stroke: "#1d4ed8", radius: 5.8 };
  }
}

interface ProjectionContext {
  minX: number;
  minY: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  height: number;
}

function createProjectionContext(
  points: DCLocalPoint[],
  width: number,
  height: number
): ProjectionContext {
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const padX = 14;
  const padY = 12;
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  // 关键：统一缩放比例，避免 x/y 独立缩放造成“拉伸”
  const scale = Math.min(usableWidth / xRange, usableHeight / yRange);
  const drawnWidth = xRange * scale;
  const drawnHeight = yRange * scale;

  const offsetX = padX + (usableWidth - drawnWidth) / 2;
  const offsetY = padY + (usableHeight - drawnHeight) / 2;

  return {
    minX,
    minY,
    scale,
    offsetX,
    offsetY,
    height,
  };
}

function projectPoints(
  points: DCLocalPoint[],
  width: number,
  height: number
): ProjectedPoint[] {
  if (points.length === 0) return [];

  const ctx = createProjectionContext(points, width, height);

  return points.map((point) => ({
    ...point,
    canvasX: ctx.offsetX + (point.x - ctx.minX) * ctx.scale,
    canvasY: ctx.height - (ctx.offsetY + (point.y - ctx.minY) * ctx.scale),
  }));
}

function projectXToLocal(
  x: number,
  points: DCLocalPoint[],
  width: number,
  height: number
): number {
  if (points.length === 0) return width / 2;

  const ctx = createProjectionContext(points, width, height);
  return ctx.offsetX + (x - ctx.minX) * ctx.scale;
}

function renderRegionHighlights(
  highlights: DCRegionHighlight[] | undefined,
  splitLineX: number | undefined,
  points: DCLocalPoint[],
  sceneWidth: number,
  sceneHeight: number
) {
  if (!highlights || !splitLineX || highlights.length === 0) return null;

  const localSplitX = projectXToLocal(splitLineX, points, sceneWidth, sceneHeight);

  return (
    <g>
      {highlights.map((highlight, index) => {
        const isLeft = highlight.side === "left";
        const x = isLeft ? 0 : localSplitX;
        const width = isLeft ? localSplitX : sceneWidth - localSplitX;

        return (
          <rect
            key={`${highlight.side}-${index}`}
            x={x}
            y={0}
            width={width}
            height={sceneHeight}
            fill={highlight.fill}
            opacity={highlight.opacity ?? 0.18}
          />
        );
      })}
    </g>
  );
}

function renderGuideLines(
  guideLines: DCGuideLine[] | undefined,
  points: DCLocalPoint[],
  sceneWidth: number,
  sceneHeight: number
) {
  if (!guideLines || guideLines.length === 0) return null;

  return (
    <g>
      {guideLines.map((line, index) => {
        const localX = projectXToLocal(line.x, points, sceneWidth, sceneHeight);

        return (
          <g key={`${line.kind}-${index}`}>
            <line
              x1={localX}
              y1={8}
              x2={localX}
              y2={sceneHeight - 8}
              stroke={line.kind === "split" ? "#0f172a" : "#f59e0b"}
              strokeWidth={line.kind === "split" ? 2.2 : 1.8}
              strokeDasharray={line.kind === "split" ? "none" : "7 5"}
              opacity={0.95}
            />
            <text
              x={localX}
              y={16}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={line.kind === "split" ? "#0f172a" : "#b45309"}
            >
              {line.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function renderStripBand(
  points: DCLocalPoint[],
  sceneWidth: number,
  sceneHeight: number,
  stripBand?: { leftX: number; rightX: number; label?: string }
) {
  if (!stripBand) return null;

  const x1 = projectXToLocal(stripBand.leftX, points, sceneWidth, sceneHeight);
  const x2 = projectXToLocal(stripBand.rightX, points, sceneWidth, sceneHeight);
  const left = Math.min(x1, x2);
  const width = Math.abs(x2 - x1);

  return (
    <g>
      <rect
        x={left}
        y={0}
        width={width}
        height={sceneHeight}
        fill="#fbbf24"
        opacity={0.17}
        stroke="#f59e0b"
        strokeDasharray="6 6"
      />
      {stripBand.label ? (
        <text
          x={left + width / 2}
          y={sceneHeight - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#92400e"
        >
          {stripBand.label}
        </text>
      ) : null}
    </g>
  );
}

function renderSegments(
  compareSegments: DCCompareSegment[] | undefined,
  projectedPoints: ProjectedPoint[]
) {
  if (!compareSegments || compareSegments.length === 0) return null;

  const pointMap = new Map(projectedPoints.map((point) => [point.id, point]));

  return (
    <g>
      {compareSegments.map((segment, index) => {
        const from = pointMap.get(segment.from);
        const to = pointMap.get(segment.to);

        if (!from || !to) return null;

        const isBest = segment.state === "best";
        const midX = (from.canvasX + to.canvasX) / 2;
        const midY = (from.canvasY + to.canvasY) / 2;

        return (
          <g key={`${segment.from}-${segment.to}-${index}`}>
            <line
              x1={from.canvasX}
              y1={from.canvasY}
              x2={to.canvasX}
              y2={to.canvasY}
              stroke={isBest ? "#10b981" : "#ef4444"}
              strokeWidth={isBest ? 3.6 : 2.8}
              strokeDasharray={isBest ? undefined : "7 5"}
              strokeLinecap="round"
            />
            {segment.label ? (
              <>
                <rect
                  x={midX - 22}
                  y={midY - 18}
                  width={44}
                  height={16}
                  rx={8}
                  fill="white"
                  stroke="#cbd5e1"
                />
                <text
                  x={midX}
                  y={midY - 7}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#334155"
                >
                  {segment.label}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

export default function DCNodeLayer({ nodes }: DCNodeLayerProps) {
  return (
    <g>
      {nodes.map((node) => {
        const cardX = node.layoutX - node.width / 2;
        const cardY = node.layoutY - node.height / 2;

        const headerHeight = 28;
        const sceneX = 10;
        const sceneY = headerHeight + 8;
        const sceneWidth = node.width - 20;
        const sceneHeight = node.height - headerHeight - 16;

        const projectedPoints = projectPoints(
          node.miniScene.points,
          sceneWidth,
          sceneHeight
        );

        const resultLabel = node.miniScene.result?.label;
        const estimatedTitleWidth = node.title.length * 8.2;
        const reservedRight = node.isSummaryNode ? 76 : 14;
        const pillWidth = resultLabel
          ? Math.max(56, resultLabel.length * 6.2 + 18)
          : 0;

        const rawPillX = 14 + estimatedTitleWidth + 12;
        const maxPillX = node.width - reservedRight - pillWidth;
        const pillX = resultLabel
          ? Math.max(14, Math.min(rawPillX, Math.max(14, maxPillX)))
          : 0;

        return (
          <g
            key={node.id}
            style={{
              transformOrigin: "0 0",
              transform: `translate(${cardX}px, ${cardY}px)`,
              opacity: node.opacity ?? 1,
            }}
            className="dc-node-group"
          >
            <rect
              x={0}
              y={0}
              width={node.width}
              height={node.height}
              rx={16}
              className={getNodeCardClassName(node)}
            />

            <text x={14} y={20} fontSize="14" fontWeight="700" fill="#0f172a">
              {node.title}
            </text>

            {node.isSummaryNode ? (
              <text
                x={node.width - 14}
                y={20}
                textAnchor="end"
                fontSize="10.5"
                fontWeight="700"
                fill="#7c3aed"
              >
                SUMMARY
              </text>
            ) : null}

            {resultLabel ? (
              <g>
                <rect
                  x={pillX}
                  y={8}
                  width={pillWidth}
                  height={16}
                  rx={8}
                  fill="white"
                  stroke="#cbd5e1"
                />
                <text
                  x={pillX + pillWidth / 2}
                  y={20}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {resultLabel}
                </text>
              </g>
            ) : null}

            <rect
              x={sceneX}
              y={sceneY}
              width={sceneWidth}
              height={sceneHeight}
              rx={12}
              fill="#f8fafc"
              stroke="#e2e8f0"
            />

            <g transform={`translate(${sceneX}, ${sceneY})`}>
              {renderRegionHighlights(
                node.miniScene.regionHighlights,
                node.miniScene.splitLineX,
                node.miniScene.points,
                sceneWidth,
                sceneHeight
              )}

              {renderStripBand(
                node.miniScene.points,
                sceneWidth,
                sceneHeight,
                node.miniScene.stripBand
              )}

              {renderGuideLines(
                node.miniScene.guideLines,
                node.miniScene.points,
                sceneWidth,
                sceneHeight
              )}

              {renderSegments(node.miniScene.compareSegments, projectedPoints)}

              {projectedPoints.map((point) => {
                const style = getLocalPointStyle(point.state);

                return (
                  <g key={point.id}>
                    <circle
                      cx={point.canvasX}
                      cy={point.canvasY}
                      r={style.radius}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={2}
                    />
                    <text
                      x={point.canvasX}
                      y={point.canvasY - 9}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#0f172a"
                    >
                      {point.label ?? point.id}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        );
      })}
    </g>
  );
}