"use client";

import { useState, useTransition } from "react";
import { setAyahStatus } from "@/features/hifz-tracking/actions";
import type { HifzStatus } from "@/types/quran";

type SettableStatus = Extract<
  HifzStatus,
  "LEARNING" | "MEMORIZED" | "NEEDS_REVISION" | "WEAK" | "RE_MEMORIZING"
>;

const STATUS_OPTIONS: { value: SettableStatus; label: string }[] = [
  { value: "LEARNING", label: "Learning" },
  { value: "MEMORIZED", label: "Memorized" },
  { value: "NEEDS_REVISION", label: "Needs Revision" },
  { value: "WEAK", label: "Weak" },
  { value: "RE_MEMORIZING", label: "Re-memorizing" },
];

export function AyahStatusControls({
  ayahId,
  initialStatus,
  onStatusChange,
}: {
  ayahId: string;
  initialStatus: HifzStatus | "NOT_STARTED";
  /** Lets the parent (reader) update its own status map without a full reload. */
  onStatusChange?: (ayahId: string, status: HifzStatus | "NOT_STARTED") => void;
}) {
  const [status, setStatus] = useState<HifzStatus | "NOT_STARTED">(initialStatus);
  const [pendingValue, setPendingValue] = useState<HifzStatus | "NOT_STARTED" | null>(null);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyStatus(next: HifzStatus | "NOT_STARTED") {
    // Clicking the already-active status resets it (toggle behavior),
    // matching "the currently selected status should be visually obvious"
    // plus giving an easy undo without a separate confirmation step.
    const target = next === status ? "NOT_STARTED" : next;

    setPendingValue(target);
    setFeedback(null);

    startTransition(async () => {
      const result = await setAyahStatus(ayahId, target);
      if (result.ok) {
        setStatus(result.status);
        setFeedback("success");
        onStatusChange?.(ayahId, result.status);
      } else {
        setFeedback("error");
      }
      setPendingValue(null);
      // Success flashes briefly, then clears itself.
      if (result.ok) {
        setTimeout(() => setFeedback((f) => (f === "success" ? null : f)), 1500);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          const isThisPending = isPending && pendingValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => applyStatus(opt.value)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-60 ${
                isActive
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-brand-200 dark:border-brand-800 hover:border-brand-400"
              }`}
            >
              {isThisPending ? "Saving…" : opt.label}
            </button>
          );
        })}
        {status !== "NOT_STARTED" && (
          <button
            onClick={() => applyStatus("NOT_STARTED")}
            disabled={isPending}
            className="text-xs rounded-full px-3 py-1.5 border border-dashed border-ink-light/20 dark:border-ink-dark/20 text-ink-light/50 dark:text-ink-dark/50 hover:border-ink-light/40 disabled:opacity-60"
          >
            {isPending && pendingValue === "NOT_STARTED" ? "Resetting…" : "Reset Status"}
          </button>
        )}
      </div>
      <div className="h-4 mt-1">
        {feedback === "success" && (
          <p className="text-[11px] text-brand-600 dark:text-brand-400">Saved.</p>
        )}
        {feedback === "error" && (
          <p className="text-[11px] text-red-600 dark:text-red-400">
            Couldn't save — please try again.
          </p>
        )}
      </div>
    </div>
  );
}
