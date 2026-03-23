import { useMemo } from "react";
import { generateBruteForceSteps } from "../../algorithms/bruteForce/bruteForceStepGenerator";
import PlayerControls from "../../components/controls/PlayerControls";
import StepInfoPanel from "../../components/controls/StepInfoPanel";
import VisualizerCanvas from "../../components/renderer/VisualizerCanvas";
import { useStepPlayer } from "../../core/player/useStepPlayer";
import { bruteForceSamplePoints } from "../../data/samplePoints";

export default function BruteForcePage() {
  const steps = useMemo(() => {
    return generateBruteForceSteps({ points: bruteForceSamplePoints });
  }, []);

  const player = useStepPlayer(steps, {
    autoPlayIntervalMs: 800,
  });

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1>蛮力法执行过程可视化</h1>
          <p>
            这里只展示算法执行过程本身，不展示随机点生成等非算法步骤。
          </p>
        </div>
      </header>

      <main className="page-main">
        <section className="visualizer-section">
          <VisualizerCanvas step={player.currentStep} />
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

        <StepInfoPanel step={player.currentStep} />
      </main>
    </div>
  );
}