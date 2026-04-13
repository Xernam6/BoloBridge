"use client";
import { useState, useEffect } from "react";
import { format, subDays, addDays, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

interface ContributionDay { date: string; count: number; }
interface GitHubCalendarProps { data: ContributionDay[]; colors?: string[]; }

const GitHubCalendar = ({ data, colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"] }: GitHubCalendarProps) => {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const today = new Date();
  const startDate = subDays(today, 364);
  const weeks = 53;

  useEffect(() => {
    setContributions(data);
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return colors[0];
    if (count === 1) return colors[1];
    if (count === 2) return colors[2];
    if (count === 3) return colors[3];
    return colors[4] || colors[colors.length - 1];
  };

  const renderWeeks = () => {
    const weeksArray = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

    for (let i = 0; i < weeks; i++) {
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
      });

      weeksArray.push(
        <div key={i} className="flex flex-col gap-1">
          {weekDays.map((day, index) => {
            const contribution = contributions.find((c) => isSameDay(new Date(c.date), day));
            const color = contribution ? getColor(contribution.count) : colors[0];
            return (
              <div key={index} className={`w-3 h-3 rounded-[4px]`} style={{ backgroundColor: color }} title={`${format(day, "PPP")}: ${contribution?.count || 0}`} />
            );
          })}
        </div>
      );
      currentWeekStart = addDays(currentWeekStart, 7);
    }
    return weeksArray;
  };

  const renderMonthLabels = () => {
    const months = [];
    const seen = new Set<string>();
    let current = startDate;
    for (let i = 0; i < 13; i++) {
      const label = format(current, "MMM");
      if (!seen.has(label)) {
        months.push(<span key={label} className="text-xs text-gray-500">{label}</span>);
        seen.add(label);
      }
      current = addMonths(startDate, i + 1);
    }
    return months;
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="flex">
        <div className="flex flex-col justify-between mt-5.5 mr-2">
          {dayLabels.map((day, index) => (
            <span key={index} className="text-xs text-gray-500 h-3">{day}</span>
          ))}
        </div>
        <div>
          <div className="flex justify-between gap-4 mb-2">{renderMonthLabels()}</div>
          <div className="flex gap-1">{renderWeeks()}</div>
        </div>
      </div>
      <div className="mt-4 justify-end flex gap-2 text-xs items-center text-gray-500">
        <span>Less</span>
        {colors.map((color, index) => (
          <div key={index} className="w-3 h-3 rounded-[4px]" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export { GitHubCalendar };
