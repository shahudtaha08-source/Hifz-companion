"use client";

import { REPEAT_PRESETS } from "@/types/audio";

export function RepeatPresetPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (count: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {REPEAT_PRESETS.map((count) => (
        <button
          key={count}
          onClick={() => onChange(count)}
          aria-pressed={value === count}
          className={`text-xs rounded-full w-8 h-8 flex items-center justify-center border transition-colors ${
            value === count
              ? "bg-brand-600 border-brand-600 text-white"
              : "border-brand-200 dark:border-brand-800 hover:border-brand-400"
          }`}
        >
          {count === 1 ? "1×" : count}
        </button>
      ))}
    </div>
  );
}
