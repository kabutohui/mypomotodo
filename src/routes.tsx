import { TasksPage } from './pages/TasksPage';
import { StatsPage } from './pages/StatsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '番茄任务',
    path: '/',
    element: <TasksPage />
  },
  {
    name: '数据统计',
    path: '/stats',
    element: <StatsPage />
  },
  {
    name: '历史记录',
    path: '/history',
    element: <HistoryPage />
  },
  {
    name: '设置',
    path: '/settings',
    element: <SettingsPage />
  }
];

export default routes;
