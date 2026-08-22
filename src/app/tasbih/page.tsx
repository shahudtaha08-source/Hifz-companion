"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hifz-companion-tasbih-v1";
const TARGETS = [33, 100, 500, 1000];

export default function TasbihPage() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (Number.isInteger(saved.count) && saved.count >= 0) setCount(saved.count);
      if (TARGETS.includes(saved.target)) setTarget(saved.target);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, target }));
  }, [count, target, loaded]);

  function increment() {
    setCount((value) => value + 1);
    if (navigator.vibrate) navigator.vibrate(8);
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 sm:py-12 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Offline-friendly</p>
      <h1 className="mt-2 text-3xl font-semibold">Tasbih Counter</h1>
      <p className="mt-2 text-sm text-ink-light/60 dark:text-ink-dark/60">Your count is saved on this device, so it remains available without an internet connection.</p>

      <div className="mt-8 rounded-3xl border border-brand-100 dark:border-brand-900 p-6 sm:p-8 shadow-sm">
        <div className="text-6xl sm:text-7xl font-semibold tabular-nums text-brand-700 dark:text-brand-300">{count}</div>
        <div className="mt-2 text-sm text-ink-light/50 dark:text-ink-dark/50">Target: {target}</div>
        <div className="mt-5 h-2 rounded-full bg-brand-100 dark:bg-brand-950 overflow-hidden"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, (count / target) * 100)}%` }} /></div>
        <button onClick={increment} className="mt-8 w-full min-h-36 rounded-2xl bg-brand-600 text-2xl font-medium text-white shadow-sm active:scale-[0.99] hover:bg-brand-700 transition">Tap to count</button>
        <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setCount((value) => value + 1)} className="min-h-11 rounded-lg border border-brand-200 dark:border-brand-800 text-sm">+1</button><button onClick={() => setCount((value) => value + 33)} className="min-h-11 rounded-lg border border-brand-200 dark:border-brand-800 text-sm">+33</button></div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">{TARGETS.map((value) => <button key={value} onClick={() => setTarget(value)} className={`min-h-10 rounded-full px-4 text-xs border ${target === value ? "bg-brand-600 text-white border-brand-600" : "border-brand-200 dark:border-brand-800"}`}>{value}</button>)}</div>
        <button onClick={() => setCount(0)} className="mt-5 min-h-10 px-4 text-xs text-red-600 dark:text-red-400">Reset counter</button>
      </div>
    </main>
  );
}
