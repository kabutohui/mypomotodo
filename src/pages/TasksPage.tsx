import { useState, useEffect } from 'react';
import { Timer, Trash2, GripVertical, MoreVertical, Bell, Edit2, Play, Pause, Square, ChevronDown, ChevronUp, Calendar, BarChart3, History as HistoryIcon, Settings, BookOpen, Save, Download, Upload, Github, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { saveTasks, loadTasks, saveRecords, loadRecords, loadSettings, saveSettings, exportAllData, importAllData } from '@/lib/storage';
import { getTodayPomodoroCount, getWeekPomodoroCount } from '@/lib/stats';
import { uploadToGitHub, downloadFromGitHub } from '@/lib/github-sync';
import type { PomodoroTask, PomodoroRecord, AppSettings } from '@/types';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type BottomView = 'hidden' | 'stats' | 'pomodoro-history' | 'task-history';

export function TasksPage() {
  const [tasks, setTasks] = useState<PomodoroTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [records, setRecords] = useState<PomodoroRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  
  // 番茄钟状态
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroDuration * 60);
  const [currentPomodoroTask, setCurrentPomodoroTask] = useState<string>('');
  const [currentPomodoroStartTime, setCurrentPomodoroStartTime] = useState<Date | null>(null);
  
  // 番茄完成后的输入状态
  const [showPomodoroInput, setShowPomodoroInput] = useState(false);
  const [pomodoroInputValue, setPomodoroInputValue] = useState('');
  
  // 提醒设置对话框
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedTaskForReminder, setSelectedTaskForReminder] = useState<PomodoroTask | null>(null);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderContent, setReminderContent] = useState('');
  
  // 设置对话框
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 说明文档对话框
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  
  // 番茄历史记录编辑/删除/补打
  const [editRecordDialogOpen, setEditRecordDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PomodoroRecord | null>(null);
  const [editRecordTitle, setEditRecordTitle] = useState('');
  const [editRecordTags, setEditRecordTags] = useState('');
  const [editRecordDate, setEditRecordDate] = useState('');
  const [editRecordStartTime, setEditRecordStartTime] = useState('');
  const [editRecordDuration, setEditRecordDuration] = useState('');
  const [editRecordNote, setEditRecordNote] = useState('');
  
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false);
  const [newRecordTitle, setNewRecordTitle] = useState('');
  const [newRecordTags, setNewRecordTags] = useState('');
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordStartTime, setNewRecordStartTime] = useState('');
  const [newRecordDuration, setNewRecordDuration] = useState('25');
  const [newRecordNote, setNewRecordNote] = useState('');
  
  const [deleteRecordDialogOpen, setDeleteRecordDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  
  // 底部视图状态
  const [bottomView, setBottomView] = useState<BottomView>('hidden');
  
  // 分页状态
  const [pomodoroHistoryPage, setPomodoroHistoryPage] = useState(1);
  const [taskHistoryPage, setTaskHistoryPage] = useState(1);
  
  // 时间段筛选状态
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');
  const [pomodoroStartDate, setPomodoroStartDate] = useState('');
  const [pomodoroEndDate, setPomodoroEndDate] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  
  const itemsPerPage = 20;
  
  const { toast } = useToast();

  // 加载数据
  useEffect(() => {
    setTasks(loadTasks().sort((a, b) => a.order - b.order));
    setRecords(loadRecords());
  }, []);

  // 保存任务
  useEffect(() => {
    if (tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks]);

  // 番茄钟计时器
  useEffect(() => {
    if (!isTimerRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 番茄钟完成
          completePomodo();
          return settings.pomodoroDuration * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isPaused]);

  // 解析任务输入（支持#标签）
  const parseTaskInput = (input: string) => {
    const tagRegex = /#(\S+)/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(input)) !== null) {
      tags.push(match[1]);
    }
    
    const title = input.replace(tagRegex, '').trim();
    return { title, tags };
  };

  // 添加任务（回车触发）
  const addTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (!newTaskInput.trim()) return;

    const { title, tags } = parseTaskInput(newTaskInput);
    if (!title) return;

    const newTask: PomodoroTask = {
      id: Date.now().toString(),
      title,
      tags,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length,
      inProgress: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskInput('');
  };

  // 删除任务
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // 切换任务完成状态
  const toggleTaskComplete = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  // 开始编辑任务
  const startEditTask = (task: PomodoroTask) => {
    setEditingTaskId(task.id);
    const tagsStr = task.tags.map(t => `#${t}`).join(' ');
    setEditingTaskTitle(`${task.title} ${tagsStr}`.trim());
  };

  // 保存编辑的任务
  const saveEditTask = (id: string) => {
    if (!editingTaskTitle.trim()) return;
    
    const { title, tags } = parseTaskInput(editingTaskTitle);
    if (!title) return;

    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, title, tags } : t
      )
    );
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 放置
  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex((t) => t.id === targetTaskId);

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    // 更新order
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      order: index,
    }));

    setTasks(updatedTasks);
  };

  // 开始番茄钟
  const startPomodoro = (taskTitle?: string) => {
    setIsTimerRunning(true);
    setIsPaused(false);
    setTimeLeft(settings.pomodoroDuration * 60);
    setCurrentPomodoroTask(taskTitle || '');
    setCurrentPomodoroStartTime(new Date());
    setShowPomodoroInput(false);
  };

  // 暂停番茄钟
  const pausePomodoro = () => {
    setIsPaused(true);
  };

  // 继续番茄钟
  const resumePomodoro = () => {
    setIsPaused(false);
  };

  // 停止番茄钟
  const stopPomodoro = () => {
    setIsTimerRunning(false);
    setIsPaused(false);
    setTimeLeft(settings.pomodoroDuration * 60);
    setCurrentPomodoroTask('');
    setCurrentPomodoroStartTime(null);
    setShowPomodoroInput(false);
  };

  // 完成番茄钟
  const completePomodo = () => {
    if (!currentPomodoroStartTime) return;

    // 停止计时器
    setIsTimerRunning(false);
    setIsPaused(false);
    setTimeLeft(settings.pomodoroDuration * 60);

    // 显示输入框，自动填充第一个任务（标签在前，格式：#工作 xxx）
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0) {
      const firstTask = incompleteTasks[0];
      const tagsStr = firstTask.tags.map(t => `#${t}`).join(' ');
      const fullText = tagsStr ? `${tagsStr} ${firstTask.title}` : firstTask.title;
      setPomodoroInputValue(currentPomodoroTask || fullText);
    } else {
      setPomodoroInputValue(currentPomodoroTask || '');
    }
    setShowPomodoroInput(true);
  };

  // 保存完成的番茄（回车触发）
  const saveCompletedPomodoro = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (!currentPomodoroStartTime) return;

    const { title, tags } = parseTaskInput(pomodoroInputValue);
    const endTime = new Date();
    const record: PomodoroRecord = {
      id: Date.now().toString(),
      taskId: '',
      taskTitle: title || '未命名番茄',
      tags: tags,
      startTime: currentPomodoroStartTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: settings.pomodoroDuration,
      completed: true,
      note: '',
    };

    const newRecords = [...records, record];
    setRecords(newRecords);
    saveRecords(newRecords);

    // 如果有关联任务，更新任务的完成番茄数
    if (title) {
      const task = tasks.find(t => t.title === title);
      if (task) {
        setTasks(
          tasks.map((t) =>
            t.id === task.id
              ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
              : t
          )
        );
      }
    }

    toast({
      title: '番茄钟已完成！🍅',
      description: `完成时长：${settings.pomodoroDuration}分钟`,
    });

    // 重置状态
    setCurrentPomodoroTask('');
    setCurrentPomodoroStartTime(null);
    setShowPomodoroInput(false);
    setPomodoroInputValue('');
  };

  // 保存设置
  const handleSaveSettings = () => {
    setSettings(tempSettings);
    saveSettings(tempSettings);
    setTimeLeft(tempSettings.pomodoroDuration * 60);
    toast({
      title: '设置已保存',
    });
    setSettingsDialogOpen(false);
  };

  // 导出数据
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: '导出成功',
      description: '数据已导出到本地文件',
    });
  };

  // 导入数据
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          importAllData(data);
          toast({
            title: '导入成功',
            description: '数据已导入，请刷新页面查看',
          });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          toast({
            title: '导入失败',
            description: '文件格式错误',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 上传到GitHub
  const handleUploadToGitHub = async () => {
    if (!tempSettings.githubSync.enabled) {
      toast({
        title: '请先配置GitHub同步',
        description: '请填写完整的GitHub配置信息',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      await uploadToGitHub(tempSettings.githubSync);
      toast({
        title: '上传成功',
        description: '数据已同步到GitHub',
      });
    } catch (error) {
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 从GitHub下载
  const handleDownloadFromGitHub = async () => {
    if (!tempSettings.githubSync.enabled) {
      toast({
        title: '请先配置GitHub同步',
        description: '请填写完整的GitHub配置信息',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      await downloadFromGitHub(tempSettings.githubSync);
      toast({
        title: '下载成功',
        description: '数据已从GitHub同步，请刷新页面查看',
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast({
        title: '下载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 打开编辑记录对话框
  const startEditRecord = (record: PomodoroRecord) => {
    setSelectedRecord(record);
    setEditRecordTitle(record.taskTitle);
    setEditRecordTags(record.tags.join(', '));
    setEditRecordDate(format(new Date(record.startTime), 'yyyy-MM-dd'));
    setEditRecordStartTime(format(new Date(record.startTime), 'HH:mm'));
    setEditRecordDuration(record.duration.toString());
    setEditRecordNote(record.note || '');
    setEditRecordDialogOpen(true);
  };

  // 保存编辑的记录
  const handleSaveEditRecord = () => {
    if (!selectedRecord || !editRecordTitle.trim()) {
      toast({
        title: '请输入任务标题',
        variant: 'destructive',
      });
      return;
    }

    const startDateTime = new Date(`${editRecordDate}T${editRecordStartTime}`);
    const duration = parseInt(editRecordDuration) || 25;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    
    const tags = editRecordTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedRecord: PomodoroRecord = {
      ...selectedRecord,
      taskTitle: editRecordTitle,
      tags,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration,
      note: editRecordNote,
    };

    const newRecords = records.map((r) =>
      r.id === selectedRecord.id ? updatedRecord : r
    );
    setRecords(newRecords);
    saveRecords(newRecords);

    toast({
      title: '番茄记录已更新',
    });

    setEditRecordDialogOpen(false);
    setSelectedRecord(null);
  };

  // 打开补打番茄对话框
  const openAddRecordDialog = () => {
    setNewRecordTitle('');
    setNewRecordTags('');
    setNewRecordDate(format(new Date(), 'yyyy-MM-dd'));
    setNewRecordStartTime(format(new Date(), 'HH:mm'));
    setNewRecordDuration('25');
    setNewRecordNote('');
    setAddRecordDialogOpen(true);
  };

  // 保存新记录（补打番茄）
  const handleSaveNewRecord = () => {
    if (!newRecordTitle.trim()) {
      toast({
        title: '请输入任务标题',
        variant: 'destructive',
      });
      return;
    }

    const startDateTime = new Date(`${newRecordDate}T${newRecordStartTime}`);
    const duration = parseInt(newRecordDuration) || 25;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    
    const tags = newRecordTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newRecord: PomodoroRecord = {
      id: Date.now().toString(),
      taskId: '',
      taskTitle: newRecordTitle,
      tags,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration,
      completed: true,
      note: newRecordNote,
    };

    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    saveRecords(newRecords);

    toast({
      title: '番茄记录已添加',
      description: `"${newRecordTitle}" 已添加到历史记录`,
    });

    setAddRecordDialogOpen(false);
  };

  // 打开删除确认对话框
  const confirmDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteRecordDialogOpen(true);
  };

  // 删除记录
  const handleDeleteRecord = () => {
    if (!recordToDelete) return;

    const newRecords = records.filter((r) => r.id !== recordToDelete);
    setRecords(newRecords);
    saveRecords(newRecords);

    toast({
      title: '番茄记录已删除',
    });

    setDeleteRecordDialogOpen(false);
    setRecordToDelete(null);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取今天的番茄记录（最多5条）
  const getTodayRecords = () => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    return records
      .filter(r => {
        const recordDate = new Date(r.startTime);
        return recordDate >= start && recordDate <= end;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  };

  // 获取未完成的任务
  const incompleteTasks = tasks.filter(t => !t.completed);

  // 切换底部视图
  const toggleBottomView = (view: BottomView) => {
    if (bottomView === view) {
      setBottomView('hidden');
    } else {
      setBottomView(view);
      // 重置分页
      if (view === 'pomodoro-history') {
        setPomodoroHistoryPage(1);
      } else if (view === 'task-history') {
        setTaskHistoryPage(1);
      }
    }
  };

  // 时间段筛选辅助函数
  const isInDateRange = (dateStr: string, startDate: string, endDate: string) => {
    if (!startDate && !endDate) return true;
    
    const date = new Date(dateStr);
    const start = startDate ? startOfDay(new Date(startDate)) : new Date(0);
    const end = endDate ? endOfDay(new Date(endDate)) : new Date();
    
    return isWithinInterval(date, { start, end });
  };

  // 获取过滤后的番茄历史记录
  const getFilteredPomodoroRecords = () => {
    let filtered = [...records].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    if (pomodoroStartDate || pomodoroEndDate) {
      filtered = filtered.filter(r => 
        isInDateRange(r.startTime, pomodoroStartDate, pomodoroEndDate)
      );
    }

    return filtered;
  };

  // 获取过滤后的任务历史记录
  const getFilteredTaskRecords = () => {
    let filtered = tasks.filter(t => t.completed);

    if (taskStartDate || taskEndDate) {
      filtered = filtered.filter(t => {
        if (!t.updatedAt) return false;
        return isInDateRange(t.updatedAt, taskStartDate, taskEndDate);
      });
    }

    return filtered.sort((a, b) => 
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  };

  // 获取过滤后的统计数据
  const getFilteredStatsRecords = () => {
    if (!statsStartDate && !statsEndDate) return records;
    
    return records.filter(r => 
      isInDateRange(r.startTime, statsStartDate, statsEndDate)
    );
  };

  // 分页计算
  const filteredPomodoroRecords = getFilteredPomodoroRecords();
  const totalPomodoroPages = Math.ceil(filteredPomodoroRecords.length / itemsPerPage);
  const paginatedPomodoroRecords = filteredPomodoroRecords.slice(
    (pomodoroHistoryPage - 1) * itemsPerPage,
    pomodoroHistoryPage * itemsPerPage
  );

  const filteredTaskRecords = getFilteredTaskRecords();
  const totalTaskPages = Math.ceil(filteredTaskRecords.length / itemsPerPage);
  const paginatedTaskRecords = filteredTaskRecords.slice(
    (taskHistoryPage - 1) * itemsPerPage,
    taskHistoryPage * itemsPerPage
  );

  // 按日期分组番茄记录
  const groupPomodoroByDate = (records: PomodoroRecord[]) => {
    const groups: { [key: string]: PomodoroRecord[] } = {};
    records.forEach(r => {
      const dateKey = format(new Date(r.startTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(r);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // 按日期分组任务记录
  const groupTasksByDate = (tasks: PomodoroTask[]) => {
    const groups: { [key: string]: PomodoroTask[] } = {};
    tasks.forEach(t => {
      if (!t.updatedAt) return;
      const dateKey = format(new Date(t.updatedAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // 准备图表数据（使用过滤后的记录）
  const prepareChartData = () => {
    const statsRecords = getFilteredStatsRecords();
    
    // 如果有时间段筛选，使用筛选范围；否则使用最近7天
    let days = 7;
    let startDate = subDays(new Date(), 6);
    
    if (statsStartDate && statsEndDate) {
      const start = new Date(statsStartDate);
      const end = new Date(statsEndDate);
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      startDate = start;
    }

    const dateRange = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return format(date, 'MM-dd');
    });

    const dailyData = dateRange.map(dateStr => {
      const count = statsRecords.filter(r => {
        const recordDate = format(new Date(r.startTime), 'MM-dd');
        return recordDate === dateStr && r.completed;
      }).length;
      return { date: dateStr, count };
    });

    // 标签统计
    const tagCounts: { [key: string]: number } = {};
    statsRecords.forEach(r => {
      r.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const totalTagCount = Object.values(tagCounts).reduce((sum, count) => sum + count, 0);
    const tagData = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ 
        name, 
        value,
        percentage: totalTagCount > 0 ? ((value / totalTagCount) * 100).toFixed(1) : '0'
      }));

    // 周统计数据
    const weekData = Array.from({ length: Math.min(4, Math.ceil(days / 7)) }, (_, i) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const count = statsRecords.filter(r => {
        const recordDate = new Date(r.startTime);
        return recordDate >= weekStart && recordDate <= weekEnd && r.completed;
      }).length;
      
      return {
        week: `第${i + 1}周`,
        count
      };
    });

    return { dailyData, tagData, weekData };
  };

  const { dailyData, tagData, weekData } = prepareChartData();
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

  // 统计数据
  const statsRecords = getFilteredStatsRecords();
  const totalPomodoros = statsRecords.filter(r => r.completed).length;
  const totalMinutes = statsRecords.reduce((sum, r) => sum + r.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const completedTasks = tasks.filter(t => t.completed).length;
  const todayCount = getTodayPomodoroCount(records);
  const weekCount = getWeekPomodoroCount(records);

  // 自定义饼图标签
  const renderCustomLabel = (entry: any) => {
    return `${entry.name} ${entry.percentage}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 xl:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">番茄土豆</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDocsDialogOpen(true)}
            >
              <BookOpen className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setTempSettings(settings);
                setSettingsDialogOpen(true);
              }}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto p-4 xl:p-6 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 左侧：番茄钟 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  开始番茄
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isTimerRunning && !showPomodoroInput ? (
                  <Button
                    onClick={() => startPomodoro()}
                    className="w-full h-16 text-lg"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    开始番茄钟
                  </Button>
                ) : showPomodoroInput ? (
                  <div className="space-y-2">
                    <Label>番茄记录（回车保存）</Label>
                    <Input
                      value={pomodoroInputValue}
                      onChange={(e) => setPomodoroInputValue(e.target.value)}
                      onKeyDown={saveCompletedPomodoro}
                      placeholder="输入番茄记录..."
                      autoFocus
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      按回车键保存记录
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 圆形进度 */}
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-muted"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 70}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 70 * (1 - timeLeft / (settings.pomodoroDuration * 60))
                            }`}
                            className="text-primary transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
                        </div>
                      </div>
                      {currentPomodoroTask && (
                        <p className="mt-4 text-lg font-medium text-center">{currentPomodoroTask}</p>
                      )}
                    </div>

                    {/* 控制按钮 */}
                    <div className="flex gap-2">
                      {!isPaused ? (
                        <Button onClick={pausePomodoro} variant="outline" className="flex-1">
                          <Pause className="w-4 h-4 mr-2" />
                          暂停
                        </Button>
                      ) : (
                        <Button onClick={resumePomodoro} variant="outline" className="flex-1">
                          <Play className="w-4 h-4 mr-2" />
                          继续
                        </Button>
                      )}
                      <Button onClick={stopPomodoro} variant="outline" className="flex-1">
                        <Square className="w-4 h-4 mr-2" />
                        停止
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 今日番茄记录 */}
            <Card>
              <CardHeader>
                <CardTitle>今日番茄记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {getTodayRecords().length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      还没有完成任何番茄钟
                    </p>
                  ) : (
                    getTodayRecords().map((record) => (
                      <div
                        key={record.id}
                        className="text-sm py-2 px-3 rounded hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-muted-foreground">
                          {format(new Date(record.startTime), 'HH:mm', { locale: zhCN })}-
                          {format(new Date(record.endTime), 'HH:mm', { locale: zhCN })}
                        </span>
                        <span className="ml-2">{record.taskTitle}</span>
                        {record.tags.length > 0 && (
                          <span className="ml-2">
                            {record.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs ml-1">
                                #{tag}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：任务列表 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>任务列表</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 添加任务输入框 */}
                <Input
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={addTask}
                  placeholder="添加todo（回车添加，支持 #标签）"
                  className="text-base"
                />

                {/* 任务列表 */}
                <div className="space-y-1">
                  {incompleteTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      暂无任务，添加一个开始吧！
                    </p>
                  ) : (
                    incompleteTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, task.id)}
                        className={cn(
                          'flex items-center gap-2 py-2 px-3 rounded hover:bg-accent/50 transition-colors cursor-move',
                          draggedTaskId === task.id && 'opacity-50'
                        )}
                        onDoubleClick={() => startEditTask(task)}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskComplete(task.id)}
                        />

                        <div className="flex-1 min-w-0">
                          {editingTaskId === task.id ? (
                            <Input
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              onBlur={() => saveEditTask(task.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveEditTask(task.id);
                                } else if (e.key === 'Escape') {
                                  setEditingTaskId(null);
                                  setEditingTaskTitle('');
                                }
                              }}
                              autoFocus
                              className="h-7 text-sm"
                            />
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm truncate">{task.title}</span>
                                {task.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                <span className="text-xs text-muted-foreground">
                                  {task.completedPomodoros}/{task.estimatedPomodoros}🍅
                                </span>
                              </div>
                              {task.reminderTime && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Bell className="w-3 h-3" />
                                  <span className={cn(
                                    new Date(task.reminderTime) <= new Date() && 'text-destructive font-medium'
                                  )}>
                                    {format(new Date(task.reminderTime), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                                  </span>
                                  {task.reminderContent && (
                                    <span className={cn(
                                      'text-muted-foreground',
                                      new Date(task.reminderTime) <= new Date() && 'text-destructive font-medium'
                                    )}>
                                      - {task.reminderContent}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startPomodoro(task.title)}>
                              <Play className="w-4 h-4 mr-2" />
                              开始番茄钟
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEditTask(task)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              编辑任务
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTaskForReminder(task);
                                setReminderTime(task.reminderTime || '');
                                setReminderContent(task.reminderContent || '');
                                setReminderDialogOpen(true);
                              }}
                            >
                              <Bell className="w-4 h-4 mr-2" />
                              设置提醒
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteTask(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除任务
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部统计区域 */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Button
              variant={bottomView === 'stats' ? 'default' : 'outline'}
              onClick={() => toggleBottomView('stats')}
              className="h-12 text-base"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              统计
              {bottomView === 'stats' ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
            </Button>
            <Button
              variant={bottomView === 'pomodoro-history' ? 'default' : 'outline'}
              onClick={() => toggleBottomView('pomodoro-history')}
              className="h-12 text-base"
            >
              <HistoryIcon className="w-5 h-5 mr-2" />
              番茄历史
              {bottomView === 'pomodoro-history' ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
            </Button>
            <Button
              variant={bottomView === 'task-history' ? 'default' : 'outline'}
              onClick={() => toggleBottomView('task-history')}
              className="h-12 text-base"
            >
              <Calendar className="w-5 h-5 mr-2" />
              任务历史
              {bottomView === 'task-history' ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
            </Button>
          </div>

          {/* 统计视图 */}
          {bottomView === 'stats' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>数据统计</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={statsStartDate}
                      onChange={(e) => setStatsStartDate(e.target.value)}
                      placeholder="开始日期"
                      className="w-40"
                    />
                    <span className="text-muted-foreground">至</span>
                    <Input
                      type="date"
                      value={statsEndDate}
                      onChange={(e) => setStatsEndDate(e.target.value)}
                      placeholder="结束日期"
                      className="w-40"
                    />
                    {(statsStartDate || statsEndDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatsStartDate('');
                          setStatsEndDate('');
                        }}
                      >
                        清除
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 统计卡片 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{todayCount}</div>
                      <p className="text-sm text-muted-foreground mt-1">今日番茄</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{weekCount}</div>
                      <p className="text-sm text-muted-foreground mt-1">本周番茄</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{totalPomodoros}</div>
                      <p className="text-sm text-muted-foreground mt-1">总番茄数</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {totalHours}h{remainingMinutes}m
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">总时长</p>
                    </CardContent>
                  </Card>
                </div>

                {/* 图表 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* 日趋势 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">番茄趋势</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#FF6B6B" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* 周统计 */}
                  {weekData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">周统计</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={weekData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4ECDC4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* 标签分布 */}
                  {tagData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">标签分布</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={tagData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={renderCustomLabel}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {tagData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any, name: any, props: any) => [value, `${name} (${props.payload.percentage}%)`]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* 任务统计 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">任务统计</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">已完成任务</span>
                          <span className="text-2xl font-bold">{completedTasks}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">进行中任务</span>
                          <span className="text-2xl font-bold">{incompleteTasks.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">总任务数</span>
                          <span className="text-2xl font-bold">{tasks.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 番茄历史视图 */}
          {bottomView === 'pomodoro-history' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>番茄历史</CardTitle>
                    <Button
                      onClick={openAddRecordDialog}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      补打番茄
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={pomodoroStartDate}
                      onChange={(e) => {
                        setPomodoroStartDate(e.target.value);
                        setPomodoroHistoryPage(1);
                      }}
                      placeholder="开始日期"
                      className="w-40"
                    />
                    <span className="text-muted-foreground">至</span>
                    <Input
                      type="date"
                      value={pomodoroEndDate}
                      onChange={(e) => {
                        setPomodoroEndDate(e.target.value);
                        setPomodoroHistoryPage(1);
                      }}
                      placeholder="结束日期"
                      className="w-40"
                    />
                    {(pomodoroStartDate || pomodoroEndDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPomodoroStartDate('');
                          setPomodoroEndDate('');
                          setPomodoroHistoryPage(1);
                        }}
                      >
                        清除
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupPomodoroByDate(paginatedPomodoroRecords).map(([dateKey, dateRecords]) => (
                    <div key={dateKey}>
                      <h4 className="font-medium mb-2">
                        {format(new Date(dateKey), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                        <Badge variant="secondary" className="ml-2">
                          {dateRecords.length}个
                        </Badge>
                      </h4>
                      <div className="space-y-1">
                        {dateRecords.map((record) => (
                          <div
                            key={record.id}
                            className="text-sm py-2 px-3 rounded hover:bg-accent/50 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-muted-foreground flex-shrink-0">
                                {format(new Date(record.startTime), 'HH:mm', { locale: zhCN })}-
                                {format(new Date(record.endTime), 'HH:mm', { locale: zhCN })}
                              </span>
                              <span className="ml-2">{record.taskTitle}</span>
                              {record.tags.length > 0 && (
                                <span className="flex items-center gap-1">
                                  {record.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </span>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditRecord(record)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  编辑记录
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => confirmDeleteRecord(record.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  删除记录
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* 分页控制 */}
                  {totalPomodoroPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPomodoroHistoryPage(p => Math.max(1, p - 1))}
                        disabled={pomodoroHistoryPage === 1}
                      >
                        上一页
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {pomodoroHistoryPage} / {totalPomodoroPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPomodoroHistoryPage(p => Math.min(totalPomodoroPages, p + 1))}
                        disabled={pomodoroHistoryPage === totalPomodoroPages}
                      >
                        下一页
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 任务历史视图 */}
          {bottomView === 'task-history' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>任务历史</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={taskStartDate}
                      onChange={(e) => {
                        setTaskStartDate(e.target.value);
                        setTaskHistoryPage(1);
                      }}
                      placeholder="开始日期"
                      className="w-40"
                    />
                    <span className="text-muted-foreground">至</span>
                    <Input
                      type="date"
                      value={taskEndDate}
                      onChange={(e) => {
                        setTaskEndDate(e.target.value);
                        setTaskHistoryPage(1);
                      }}
                      placeholder="结束日期"
                      className="w-40"
                    />
                    {(taskStartDate || taskEndDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTaskStartDate('');
                          setTaskEndDate('');
                          setTaskHistoryPage(1);
                        }}
                      >
                        清除
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupTasksByDate(paginatedTaskRecords).map(([dateKey, dateTasks]) => (
                    <div key={dateKey}>
                      <h4 className="font-medium mb-2">
                        {format(new Date(dateKey), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                        <Badge variant="secondary" className="ml-2">
                          {dateTasks.length}个
                        </Badge>
                      </h4>
                      <div className="space-y-1">
                        {dateTasks.map((task) => (
                          <div
                            key={task.id}
                            className="text-sm py-2 px-3 rounded hover:bg-accent/50 transition-colors flex items-center gap-2"
                          >
                            <Checkbox checked={true} disabled />
                            <span className="line-through text-muted-foreground">{task.title}</span>
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            <span className="text-xs text-muted-foreground ml-auto">
                              完成{task.completedPomodoros}个番茄
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* 分页控制 */}
                  {totalTaskPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTaskHistoryPage(p => Math.max(1, p - 1))}
                        disabled={taskHistoryPage === 1}
                      >
                        上一页
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {taskHistoryPage} / {totalTaskPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTaskHistoryPage(p => Math.min(totalTaskPages, p + 1))}
                        disabled={taskHistoryPage === totalTaskPages}
                      >
                        下一页
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 提醒设置对话框 */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置提醒</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-time">提醒时间</Label>
              <Input
                id="reminder-time"
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-content">提醒内容</Label>
              <Textarea
                id="reminder-content"
                value={reminderContent}
                onChange={(e) => setReminderContent(e.target.value)}
                placeholder="输入提醒内容..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (selectedTaskForReminder && reminderTime) {
                  const updatedTasks = tasks.map((t) =>
                    t.id === selectedTaskForReminder.id
                      ? { ...t, reminderTime, reminderContent }
                      : t
                  );
                  setTasks(updatedTasks);
                  saveTasks(updatedTasks);
                  
                  toast({
                    title: '提醒已设置',
                    description: `将在 ${format(new Date(reminderTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })} 提醒您`,
                  });
                }
                setReminderDialogOpen(false);
                setReminderTime('');
                setReminderContent('');
                setSelectedTaskForReminder(null);
              }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置对话框 */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="pomodoro" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pomodoro">番茄钟</TabsTrigger>
              <TabsTrigger value="backup">数据备份</TabsTrigger>
              <TabsTrigger value="github">GitHub同步</TabsTrigger>
            </TabsList>

            {/* 番茄钟设置 */}
            <TabsContent value="pomodoro" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pomodoro-duration">番茄时长（分钟）</Label>
                  <Input
                    id="pomodoro-duration"
                    type="number"
                    value={tempSettings.pomodoroDuration}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        pomodoroDuration: parseInt(e.target.value) || 25,
                      })
                    }
                    min="1"
                    max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short-break">短休息（分钟）</Label>
                  <Input
                    id="short-break"
                    type="number"
                    value={tempSettings.shortBreakDuration}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        shortBreakDuration: parseInt(e.target.value) || 5,
                      })
                    }
                    min="1"
                    max="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long-break">长休息（分钟）</Label>
                  <Input
                    id="long-break"
                    type="number"
                    value={tempSettings.longBreakDuration}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        longBreakDuration: parseInt(e.target.value) || 15,
                      })
                    }
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自动开始休息</Label>
                    <p className="text-sm text-muted-foreground">
                      番茄钟结束后自动开始休息计时
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.autoStartBreak}
                    onCheckedChange={(checked) =>
                      setTempSettings({ ...tempSettings, autoStartBreak: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自动开始番茄钟</Label>
                    <p className="text-sm text-muted-foreground">
                      休息结束后自动开始下一个番茄钟
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.autoStartPomodoro}
                    onCheckedChange={(checked) =>
                      setTempSettings({ ...tempSettings, autoStartPomodoro: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>提示音</Label>
                    <p className="text-sm text-muted-foreground">
                      番茄钟结束时播放提示音
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.soundEnabled}
                    onCheckedChange={(checked) =>
                      setTempSettings({ ...tempSettings, soundEnabled: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* 数据备份 */}
            <TabsContent value="backup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">导出或导入本地数据</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    导出的数据包含所有任务、记录和设置，可用于备份或迁移到其他设备
                  </p>
                  <div className="flex flex-col md:flex-row gap-3">
                    <Button onClick={handleExport} variant="outline" className="gap-2 flex-1">
                      <Download className="h-4 w-4" />
                      导出数据
                    </Button>
                    <Button onClick={handleImport} variant="outline" className="gap-2 flex-1">
                      <Upload className="h-4 w-4" />
                      导入数据
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* GitHub同步 */}
            <TabsContent value="github" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>启用GitHub同步</Label>
                <Switch
                  checked={tempSettings.githubSync.enabled}
                  onCheckedChange={(checked) =>
                    setTempSettings({
                      ...tempSettings,
                      githubSync: { ...tempSettings.githubSync, enabled: checked },
                    })
                  }
                />
              </div>

              {tempSettings.githubSync.enabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token">Personal Access Token</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={tempSettings.githubSync.token}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            githubSync: { ...tempSettings.githubSync, token: e.target.value },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        需要repo权限的GitHub Token
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="owner">仓库所有者</Label>
                        <Input
                          id="owner"
                          placeholder="username"
                          value={tempSettings.githubSync.owner}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              githubSync: { ...tempSettings.githubSync, owner: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="repo">仓库名称</Label>
                        <Input
                          id="repo"
                          placeholder="pomodoro-data"
                          value={tempSettings.githubSync.repo}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              githubSync: { ...tempSettings.githubSync, repo: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch">分支</Label>
                        <Input
                          id="branch"
                          placeholder="main"
                          value={tempSettings.githubSync.branch}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              githubSync: { ...tempSettings.githubSync, branch: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filePath">文件路径</Label>
                        <Input
                          id="filePath"
                          placeholder="pomodoro-data.json"
                          value={tempSettings.githubSync.filePath}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              githubSync: {
                                ...tempSettings.githubSync,
                                filePath: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col md:flex-row gap-3">
                    <Button
                      onClick={handleUploadToGitHub}
                      variant="outline"
                      className="gap-2 flex-1"
                      disabled={isSyncing}
                    >
                      <Upload className="h-4 w-4" />
                      {isSyncing ? '同步中...' : '上传到GitHub'}
                    </Button>
                    <Button
                      onClick={handleDownloadFromGitHub}
                      variant="outline"
                      className="gap-2 flex-1"
                      disabled={isSyncing}
                    >
                      <Download className="h-4 w-4" />
                      {isSyncing ? '同步中...' : '从GitHub下载'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 说明文档对话框 */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>使用说明</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold mb-2">📝 添加任务</h3>
              <p className="text-sm text-muted-foreground">
                在任务列表顶部的输入框中输入任务，支持使用 #标签 来分类任务（例如：写代码 #工作）。按回车键添加任务。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🍅 开始番茄钟</h3>
              <p className="text-sm text-muted-foreground">
                点击"开始番茄钟"按钮开始计时，或在任务菜单中选择"开始番茄钟"。专注工作25分钟（可在设置中调整）。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">✅ 完成番茄</h3>
              <p className="text-sm text-muted-foreground">
                番茄钟结束后，会自动显示输入框，默认填充第一个任务的内容（格式：#标签 任务标题）。您可以修改内容，按回车键保存记录。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📊 查看统计</h3>
              <p className="text-sm text-muted-foreground">
                点击底部"统计"按钮查看数据统计，包括今日番茄、本周番茄、总番茄数、总时长等。支持按时间段筛选数据。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📅 查看历史</h3>
              <p className="text-sm text-muted-foreground">
                点击"番茄历史"或"任务历史"按钮查看历史记录。支持按时间段筛选，自动分页显示（每页20条）。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚙️ 设置</h3>
              <p className="text-sm text-muted-foreground">
                点击右上角设置图标，可以调整番茄时长、短休息、长休息的时间，以及配置数据备份和GitHub同步。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💡 使用技巧</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>双击任务可以快速编辑</li>
                <li>拖拽任务可以调整顺序</li>
                <li>使用标签分类任务，便于统计分析</li>
                <li>定期查看统计数据，了解时间分配</li>
                <li>使用GitHub同步实现多设备数据共享</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑番茄记录对话框 */}
      <Dialog open={editRecordDialogOpen} onOpenChange={setEditRecordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑番茄记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-record-title">任务标题</Label>
              <Input
                id="edit-record-title"
                value={editRecordTitle}
                onChange={(e) => setEditRecordTitle(e.target.value)}
                placeholder="输入任务标题"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-record-tags">标签（用逗号分隔）</Label>
              <Input
                id="edit-record-tags"
                value={editRecordTags}
                onChange={(e) => setEditRecordTags(e.target.value)}
                placeholder="例如：工作, 学习"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-record-date">日期</Label>
                <Input
                  id="edit-record-date"
                  type="date"
                  value={editRecordDate}
                  onChange={(e) => setEditRecordDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-record-start-time">开始时间</Label>
                <Input
                  id="edit-record-start-time"
                  type="time"
                  value={editRecordStartTime}
                  onChange={(e) => setEditRecordStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-record-duration">时长（分钟）</Label>
              <Input
                id="edit-record-duration"
                type="number"
                value={editRecordDuration}
                onChange={(e) => setEditRecordDuration(e.target.value)}
                min="1"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-record-note">备注</Label>
              <Textarea
                id="edit-record-note"
                value={editRecordNote}
                onChange={(e) => setEditRecordNote(e.target.value)}
                placeholder="输入备注（可选）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEditRecord}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 补打番茄对话框 */}
      <Dialog open={addRecordDialogOpen} onOpenChange={setAddRecordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>补打番茄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-record-title">任务标题</Label>
              <Input
                id="new-record-title"
                value={newRecordTitle}
                onChange={(e) => setNewRecordTitle(e.target.value)}
                placeholder="输入任务标题"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-record-tags">标签（用逗号分隔）</Label>
              <Input
                id="new-record-tags"
                value={newRecordTags}
                onChange={(e) => setNewRecordTags(e.target.value)}
                placeholder="例如：工作, 学习"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-record-date">日期</Label>
                <Input
                  id="new-record-date"
                  type="date"
                  value={newRecordDate}
                  onChange={(e) => setNewRecordDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-record-start-time">开始时间</Label>
                <Input
                  id="new-record-start-time"
                  type="time"
                  value={newRecordStartTime}
                  onChange={(e) => setNewRecordStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-record-duration">时长（分钟）</Label>
              <Input
                id="new-record-duration"
                type="number"
                value={newRecordDuration}
                onChange={(e) => setNewRecordDuration(e.target.value)}
                min="1"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-record-note">备注</Label>
              <Textarea
                id="new-record-note"
                value={newRecordNote}
                onChange={(e) => setNewRecordNote(e.target.value)}
                placeholder="输入备注（可选）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRecordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveNewRecord}>
              <Save className="w-4 h-4 mr-2" />
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteRecordDialogOpen} onOpenChange={setDeleteRecordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条番茄记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
