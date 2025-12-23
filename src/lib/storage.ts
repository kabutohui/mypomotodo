import type { PomodoroTask, PomodoroRecord, AppSettings } from '@/types';

const STORAGE_KEYS = {
  TASKS: 'pomodoro_tasks',
  RECORDS: 'pomodoro_records',
  SETTINGS: 'pomodoro_settings',
};

// 默认设置
export const DEFAULT_SETTINGS: AppSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreak: false,
  autoStartPomodoro: false,
  soundEnabled: true,
  githubSync: {
    enabled: false,
    token: '',
    repo: '',
    owner: '',
    branch: 'main',
    filePath: 'pomodoro-data.json',
  },
};

// 任务存储
export const saveTasks = (tasks: PomodoroTask[]): void => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const loadTasks = (): PomodoroTask[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

// 记录存储
export const saveRecords = (records: PomodoroRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
};

export const loadRecords = (): PomodoroRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
  return data ? JSON.parse(data) : [];
};

// 设置存储
export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const loadSettings = (): AppSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
};

// 导出所有数据
export const exportAllData = () => {
  return {
    tasks: loadTasks(),
    records: loadRecords(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  };
};

// 导入所有数据
export const importAllData = (data: {
  tasks?: PomodoroTask[];
  records?: PomodoroRecord[];
  settings?: AppSettings;
}) => {
  if (data.tasks) saveTasks(data.tasks);
  if (data.records) saveRecords(data.records);
  if (data.settings) saveSettings(data.settings);
};
