interface StatusBarProps {
  shaderName?: string;
  fps?: number;
  className?: string;
}

export function StatusBar({
  shaderName,
  fps,
  className = "",
}: StatusBarProps) {
  return (
    <footer
      className={`flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 text-xs text-zinc-500 ${className}`}
    >
      <span>MandaStudio v1.0</span>

      {shaderName && <span>Shader: {shaderName}</span>}

      {fps !== undefined && (
        <span className="tabular-nums">{fps} FPS</span>
      )}
    </footer>
  );
}
