"use client";

// 月表示のカレンダーです。
// 予報データがある日付（availableDates）だけクリックできるようにしています。

import { useState } from "react";

type Props = {
  availableDates: string[]; // 選べる日付 "YYYY-MM-DD" の一覧
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 年・月・日から "YYYY-MM-DD" の文字列を作ります */
function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Calendar({ availableDates, selectedDate, today, onSelect }: Props) {
  // 表示中の年・月（最初は選択中の日付の月）
  const [view, setView] = useState(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return { year: y, month: m - 1 }; // month は 0〜11
  });

  const firstWeekday = new Date(view.year, view.month, 1).getDay(); // 1日が何曜日か
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate(); // その月の日数

  // 空白マス（null）＋ 1日〜月末 の配列を作ります
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const moveMonth = (diff: number) => {
    const d = new Date(view.year, view.month + diff, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-800/80">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="rounded-lg px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="前の月"
        >
          ‹
        </button>
        <p className="font-semibold">
          {view.year}年 {view.month + 1}月
        </p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="rounded-lg px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"}`}
          >
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const key = toKey(view.year, view.month, day);
          const available = availableDates.includes(key);
          const selected = key === selectedDate;

          return (
            <button
              key={key}
              type="button"
              disabled={!available}
              onClick={() => onSelect(key)}
              className={[
                "aspect-square rounded-lg transition",
                selected
                  ? "bg-sky-500 font-bold text-white"
                  : available
                    ? "bg-sky-100 font-medium text-sky-900 hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-100"
                    : "cursor-not-allowed text-slate-300 dark:text-slate-600",
                key === today && !selected ? "ring-2 ring-sky-400" : "",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        色付きの日付（今日から約5日間）の予報を表示できます
      </p>
    </div>
  );
}
