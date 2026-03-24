// app/App.tsx
import { useState } from "react";
import BruteForcePage from "./app/routes/BruteForcePage";
import DivideConquerPage from "./app/routes/DivideConquerPage";

export default function App() {
  const [currentAlgo, setCurrentAlgo] = useState<"brute" | "dc">("dc");

  const isBrute = currentAlgo === "brute";
  const title = isBrute
    ? "蛮力法执行过程可视化"
    : "分治法执行过程可视化";
  const description = isBrute
    ? "这里只展示算法执行过程本身，不展示随机点生成等非算法步骤。"
    : "父节点常驻，左子树详细展开，右子树摘要显示，子问题结果回收到父节点后执行 strip 合并。";

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
          <div className="player-buttons" style={{ marginBottom: 0 }}>
            <button
              onClick={() => setCurrentAlgo("brute")}
              style={{
                backgroundColor: isBrute ? "#10b981" : "#2563eb",
                color: "white",
              }}
            >
              蛮力法
            </button>
            <button
              onClick={() => setCurrentAlgo("dc")}
              style={{
                backgroundColor: !isBrute ? "#10b981" : "#2563eb",
                color: "white",
              }}
            >
              分治法
            </button>
          </div>
        </div>
      </header>

      {/* 根据选择渲染对应页面（页面已去掉重复的 header） */}
      {isBrute ? <BruteForcePage /> : <DivideConquerPage />}
    </div>
  );
}