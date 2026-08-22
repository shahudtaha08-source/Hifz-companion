"use client";

export function AyahToolsFloatingButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 text-white px-4 py-3 text-sm shadow-lg hover:bg-brand-700 active:scale-95 transition-transform"
    >
      <span aria-hidden>✦</span>
      <span>{label}</span>
    </button>
  );
}
