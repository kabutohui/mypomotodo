export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 番茄任务相关类型
export interface PomodoroTask {
  id: string;
  title: string;
  tags: string[];
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  reminderTime?: string;
  reminderContent?: string;
  createdAt: string;
  updatedAt: string;
  inProgress: boolean;
  order: number;
}

// 番茄记录
export interface PomodoroRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  tags: string[];
  startTime: string;
  endTime: string;
  duration: number; // 分钟
  completed: boolean;
  note?: string;
}

// 统计数据
export interface PomodoroStats {
  daily: { date: string; count: number }[];
  weekly: { week: string; count: number }[];
  monthly: { month: string; count: number }[];
  byTag: { tag: string; count: number }[];
}

// GitHub同步配置
export interface GitHubSyncConfig {
  enabled: boolean;
  token: string;
  repo: string;
  owner: string;
  branch: string;
  filePath: string;
}

// 应用设置
export interface AppSettings {
  pomodoroDuration: number; // 分钟，默认25
  shortBreakDuration: number; // 短休息，默认5
  longBreakDuration: number; // 长休息，默认15
  autoStartBreak: boolean;
  autoStartPomodoro: boolean;
  soundEnabled: boolean;
  githubSync: GitHubSyncConfig;
}
