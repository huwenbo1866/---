interface PlayerControlsProps {
  currentIndex: number;
  totalSteps: number;
  canPrev: boolean;
  canNext: boolean;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onTogglePlay: () => void;
}

export default function PlayerControls({
  currentIndex,
  totalSteps,
  canPrev,
  canNext,
  isPlaying,
  onPrev,
  onNext,
  onReset,
  onTogglePlay,
}: PlayerControlsProps) {
  return (
    <div className="player-controls">
      <div className="player-buttons">
        <button onClick={onPrev} disabled={!canPrev}>
          上一步
        </button>
        <button onClick={onNext} disabled={!canNext}>
          下一步
        </button>
        <button onClick={onReset}>重置</button>
        <button onClick={onTogglePlay} disabled={totalSteps <= 1}>
          {isPlaying ? "暂停播放" : "自动播放"}
        </button>
      </div>

      <div className="player-status">
        第 <strong>{totalSteps === 0 ? 0 : currentIndex + 1}</strong> /{" "}
        <strong>{totalSteps}</strong> 步
      </div>
    </div>
  );
}