import type { PomodoroRecord, PomodoroStats } from '@/types';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 计算统计数据
export const calculateStats = (records: PomodoroRecord[]): PomodoroStats => {
  const now = new Date();
  
  // 日统计（最近7天）
  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const count = records.filter(r => {
      const recordDate = format(startOfDay(new Date(r.startTime)), 'yyyy-MM-dd');
      return recordDate === dateStr && r.completed;
    }).length;
    return {
      date: format(date, 'MM-dd', { locale: zhCN }),
      count,
    };
  });

  // 周统计（最近4周）
  const weekly = Array.from({ length: 4 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const count = records.filter(r => {
      const recordWeekStart = format(startOfWeek(new Date(r.startTime), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      return recordWeekStart === weekStartStr && r.completed;
    }).length;
    return {
      week: format(weekStart, 'MM-dd', { locale: zhCN }),
      count,
    };
  });

  // 月统计（最近6个月）
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const monthStart = startOfMonth(subMonths(now, 5 - i));
    const monthStartStr = format(monthStart, 'yyyy-MM');
    const count = records.filter(r => {
      const recordMonth = format(startOfMonth(new Date(r.startTime)), 'yyyy-MM');
      return recordMonth === monthStartStr && r.completed;
    }).length;
    return {
      month: format(monthStart, 'MM月', { locale: zhCN }),
      count,
    };
  });

  // 标签统计
  const tagMap = new Map<string, number>();
  records.forEach(record => {
    if (record.completed) {
      record.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    }
  });
  const byTag = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return { daily, weekly, monthly, byTag };
};

// 获取今日完成的番茄数
export const getTodayPomodoroCount = (records: PomodoroRecord[]): number => {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  return records.filter(r => {
    const recordDate = format(startOfDay(new Date(r.startTime)), 'yyyy-MM-dd');
    return recordDate === today && r.completed;
  }).length;
};

// 获取本周完成的番茄数
export const getWeekPomodoroCount = (records: PomodoroRecord[]): number => {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return records.filter(r => {
    const recordWeekStart = format(startOfWeek(new Date(r.startTime), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return recordWeekStart === weekStart && r.completed;
  }).length;
};
