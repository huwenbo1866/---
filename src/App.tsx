// app/App.tsx
import { useState } from "react";
import BruteForcePage from "./app/routes/BruteForcePage";
import DivideConquerPage from "./app/routes/DivideConquerPage";
import StripDemoPage from "./app/routes/StripDemoPage";

export default function App() {
  const [currentAlgo, setCurrentAlgo] = useState<"brute" | "dc" | "strip"> ("dc");

  const isBrute = currentAlgo === "brute";
  const isDC = currentAlgo === "dc";
  const isStrip = currentAlgo === "strip";
  
  const title = isBrute
    ? "蛮力法执行过程可视化"
    : isDC
    ? "分治法执行过程可视化"
    : "带状区域线性时间复杂度演示";
  
  const description = isBrute
    ? "这里只展示算法执行过程本身，不展示随机点生成等非算法步骤。"
    : isDC
    ? "父节点常驻，左子树详细展开，右子树摘要显示，子问题结果回收到父节点后执行 strip 合并。"
    : "演示带状区域的构建和线性时间复杂度原理，每个点最多检查6个后续点。";

  return (
    <div className="page-shell">
      {/* 公共头部 + 切换按钮 */}
      <header className="page-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            <p style={{ margin: 0, color: "#475569", fontSize: "16px" }}>
              {description}
            </p>
          </div>

          {/* 算法切换按钮 */}
          <div className="player-buttons" style={{ marginBottom: 0, display: "flex", gap: "10px" }}>
            <button
              onClick={() => setCurrentAlgo("brute")}
              style={{
                backgroundColor: isBrute ? "#10b981" : "#2563eb",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              蛮力法
            </button>
            <button
              onClick={() => setCurrentAlgo("dc")}
              style={{
                backgroundColor: isDC ? "#10b981" : "#2563eb",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              分治法
            </button>
            <button
              onClick={() => setCurrentAlgo("strip")}
              style={{
                backgroundColor: isStrip ? "#10b981" : "#2563eb",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              带状区域演示
            </button>
          </div>
        </div>
      </header>

      {/* 根据选择渲染对应页面（页面已去掉重复的 header） */}
      {isBrute ? <BruteForcePage /> : isDC ? <DivideConquerPage /> : <StripDemoPage />}
    </div>
  );
}