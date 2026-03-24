import type { DCTreeEdge, DCTreeNode } from "../../core/models/divideConquer";

interface DCEdgeLayerProps {
  nodes: DCTreeNode[];
  edges: DCTreeEdge[];
}

export default function DCEdgeLayer({ nodes, edges }: DCEdgeLayerProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <g>
      {edges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);

        if (!fromNode || !toNode) return null;

        const edgeOpacity = Math.min(fromNode.opacity ?? 1, toNode.opacity ?? 1);
        if (edgeOpacity < 0.04) return null;

        const x1 = fromNode.layoutX;
        const y1 = fromNode.layoutY + fromNode.height / 2;
        const x2 = toNode.layoutX;
        const y2 = toNode.layoutY - toNode.height / 2;

        const midY = (y1 + y2) / 2;
        const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        return (
          <path
            key={edge.id}
            d={path}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeOpacity={edgeOpacity}
          />
        );
      })}
    </g>
  );
}