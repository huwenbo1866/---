interface DCOverlayLayerProps {
  width: number;
  height: number;
}

export default function DCOverlayLayer({
  width,
  height,
}: DCOverlayLayerProps) {
  return (
    <g>
      <text
        x={width - 22}
        y={height - 18}
        textAnchor="end"
        fontSize="14"
        fontWeight="700"
        fill="#64748b"
      >
        Divide &amp; Conquer
      </text>
    </g>
  );
}