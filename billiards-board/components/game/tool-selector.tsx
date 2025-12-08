'use client';

type ToolMode = 'cue' | 'hand';

interface ToolSelectorProps {
  mode: ToolMode;
  onChange: (mode: ToolMode) => void;
}

export function ToolSelector({ mode, onChange }: ToolSelectorProps) {
  const common = 'px-3 py-2 rounded-lg text-sm font-semibold transition-all border';

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg p-3 flex gap-2">
      <button
        type="button"
        className={`${common} ${
          mode === 'cue'
            ? 'bg-amber-500 text-black border-amber-300 shadow'
            : 'bg-gray-800 text-gray-200 border-transparent'
        }`}
        onClick={() => onChange('cue')}
      >
        🎱 큐대
      </button>
      <button
        type="button"
        className={`${common} ${
          mode === 'hand'
            ? 'bg-emerald-500 text-black border-emerald-300 shadow'
            : 'bg-gray-800 text-gray-200 border-transparent'
        }`}
        onClick={() => onChange('hand')}
      >
        ✋ 손바닥
      </button>
    </div>
  );
}
