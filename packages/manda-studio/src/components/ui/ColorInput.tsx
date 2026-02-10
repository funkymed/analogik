import { useState, useCallback, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (/^#[0-9a-fA-F]{0,6}$/.test(raw)) {
        onChange(raw);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="relative flex items-center gap-2">
        <button
          ref={swatchRef}
          type="button"
          onClick={handleToggle}
          className="h-6 w-6 shrink-0 rounded border border-zinc-700"
          style={{ backgroundColor: value || "#000000" }}
          aria-label={`Pick color for ${label}`}
        />
        <input
          type="text"
          value={value}
          onChange={handleHexInput}
          className="h-6 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          placeholder="#000000"
          maxLength={7}
        />
        {open && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-8 z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl"
          >
            <HexColorPicker color={value || "#000000"} onChange={onChange} />
          </div>
        )}
      </div>
    </div>
  );
}
