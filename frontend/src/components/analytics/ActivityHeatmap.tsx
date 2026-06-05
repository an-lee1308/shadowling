"use client";

import { useMemo } from "react";

interface DailyStat {
  date: string;
  sessions: number;
  accuracy: number;
}

interface Props {
  dailyStats: DailyStat[];
}

function getIntensity(sessions: number): number {
  if (sessions === 0) return 0;
  if (sessions === 1) return 1;
  if (sessions <= 3) return 2;
  if (sessions <= 5) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-primary-100 dark:bg-primary-900",
  "bg-primary-300 dark:bg-primary-700",
  "bg-primary-500 dark:bg-primary-500",
  "bg-primary-700 dark:bg-primary-300",
];

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

export default function ActivityHeatmap({ dailyStats }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const statMap = new Map(dailyStats.map((d) => [d.date, d]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 52 weeks ago, on Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 364 - start.getDay());

    const weeksArr: { date: string; sessions: number; intensity: number }[][] = [];
    const labels: { month: number; weekIndex: number }[] = [];

    let current = new Date(start);
    let weekIndex = 0;
    let lastMonth = -1;

    while (current <= today) {
      const week: typeof weeksArr[0] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().slice(0, 10);
        const stat = statMap.get(dateStr);
        week.push({
          date: dateStr,
          sessions: stat?.sessions ?? 0,
          intensity: getIntensity(stat?.sessions ?? 0),
        });

        const month = current.getMonth();
        if (month !== lastMonth && d === 0) {
          labels.push({ month, weekIndex });
          lastMonth = month;
        }

        current.setDate(current.getDate() + 1);
      }
      weeksArr.push(week);
      weekIndex++;
    }

    return { weeks: weeksArr, monthLabels: labels };
  }, [dailyStats]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex gap-[3px] ml-8 mb-1">
          {weeks.map((_, i) => {
            const label = monthLabels.find((l) => l.weekIndex === i);
            return (
              <div key={i} className="w-[11px] text-[9px] text-gray-400 dark:text-gray-600 text-center">
                {label ? MONTHS[label.month] : ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-[3px]">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="h-[11px] w-6 text-[9px] text-gray-400 dark:text-gray-600 flex items-center">
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.sessions} phiên`}
                  className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_CLASSES[day.intensity]} cursor-default`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-2 justify-end text-[10px] text-gray-400 dark:text-gray-600">
          <span>Ít</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-sm ${cls}`} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  );
}
