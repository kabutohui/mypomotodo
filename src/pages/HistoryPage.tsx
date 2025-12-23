import { useState, useEffect } from 'react';
import { History, Plus, Tag, Clock, Calendar, Edit2, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { loadRecords, saveRecords, loadTasks, loadSettings } from '@/lib/storage';
import type { PomodoroRecord, PomodoroTask } from '@/types';
import { format, startOfDay, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function HistoryPage() {
  const [records, setRecords] = useState<PomodoroRecord[]>([]);
  const [tasks, setTasks] = useState<PomodoroTask[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // 添加记录表单
  const [addTaskTitle, setAddTaskTitle] = useState('');
  const [addTags, setAddTags] = useState('');
  const [addDate, setAddDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [addStartTime, setAddStartTime] = useState(format(new Date(), 'HH:mm'));
  const [addDuration, setAddDuration] = useState('25');
  const [addNote, setAddNote] = useState('');
  
  // 编辑记录
  const [editingRecord, setEditingRecord] = useState<PomodoroRecord | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editNote, setEditNote] = useState('');
  
  // 删除记录
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const settings = loadSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedRecords = loadRecords();
    setRecords(
      loadedRecords.sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    );
    setTasks(loadTasks());
  };

  // 按日期分组记录
  const groupRecordsByDate = () => {
    const groups: { [key: string]: PomodoroRecord[] } = {};
    
    records.forEach((record) => {
      const dateKey = format(new Date(record.startTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // 添加番茄记录
  const handleAddRecord = () => {
    if (!addTaskTitle.trim()) {
      toast({
        title: '请输入任务标题',
        variant: 'destructive',
      });
      return;
    }

    const startDateTime = new Date(`${addDate}T${addStartTime}`);
    const duration = parseInt(addDuration) || 25;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    
    const tags = addTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newRecord: PomodoroRecord = {
      id: Date.now().toString(),
      taskId: '',
      taskTitle: addTaskTitle,
      tags,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration,
      completed: true,
      note: addNote,
    };

    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    saveRecords(newRecords);

    toast({
      title: '番茄记录已添加',
      description: `"${addTaskTitle}" 已添加到历史记录`,
    });

    // 重置表单
    setAddTaskTitle('');
    setAddTags('');
    setAddDate(format(new Date(), 'yyyy-MM-dd'));
    setAddStartTime(format(new Date(), 'HH:mm'));
    setAddDuration('25');
    setAddNote('');
    setIsAddDialogOpen(false);
  };

  // 开始编辑记录
  const startEditRecord = (record: PomodoroRecord) => {
    setEditingRecord(record);
    setEditTaskTitle(record.taskTitle);
    setEditTags(record.tags.join(', '));
    setEditDate(format(new Date(record.startTime), 'yyyy-MM-dd'));
    setEditStartTime(format(new Date(record.startTime), 'HH:mm'));
    setEditDuration(record.duration.toString());
    setEditNote(record.note || '');
    setIsEditDialogOpen(true);
  };

  // 保存编辑的记录
  const handleEditRecord = () => {
    if (!editingRecord || !editTaskTitle.trim()) {
      toast({
        title: '请输入任务标题',
        variant: 'destructive',
      });
      return;
    }

    const startDateTime = new Date(`${editDate}T${editStartTime}`);
    const duration = parseInt(editDuration) || 25;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    
    const tags = editTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedRecord: PomodoroRecord = {
      ...editingRecord,
      taskTitle: editTaskTitle,
      tags,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration,
      note: editNote,
    };

    const newRecords = records.map((r) =>
      r.id === editingRecord.id ? updatedRecord : r
    );
    setRecords(newRecords);
    saveRecords(newRecords);

    toast({
      title: '番茄记录已更新',
    });

    setIsEditDialogOpen(false);
    setEditingRecord(null);
  };

  // 删除记录
  const handleDeleteRecord = () => {
    if (!deletingRecordId) return;

    const newRecords = records.filter((r) => r.id !== deletingRecordId);
    setRecords(newRecords);
    saveRecords(newRecords);

    toast({
      title: '番茄记录已删除',
    });

    setIsDeleteDialogOpen(false);
    setDeletingRecordId(null);
  };

  // 统计数据
  const totalRecords = records.length;
  const completedRecords = records.filter((r) => r.completed).length;
  const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const groupedRecords = groupRecordsByDate();

  return (
    <div className="container mx-auto p-4 xl:p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="w-8 h-8 text-primary" />
            番茄历史
          </h1>
          <p className="text-muted-foreground mt-1">
            查看和管理所有番茄记录
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加记录
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加番茄记录</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-title">任务标题 *</Label>
                <Input
                  id="add-title"
                  value={addTaskTitle}
                  onChange={(e) => setAddTaskTitle(e.target.value)}
                  placeholder="输入任务标题..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-tags">标签（用逗号分隔）</Label>
                <Input
                  id="add-tags"
                  value={addTags}
                  onChange={(e) => setAddTags(e.target.value)}
                  placeholder="工作, 学习"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-date">日期</Label>
                  <Input
                    id="add-date"
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-time">开始时间</Label>
                  <Input
                    id="add-time"
                    type="time"
                    value={addStartTime}
                    onChange={(e) => setAddStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-duration">时长（分钟）</Label>
                <Input
                  id="add-duration"
                  type="number"
                  value={addDuration}
                  onChange={(e) => setAddDuration(e.target.value)}
                  min="1"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-note">备注</Label>
                <Textarea
                  id="add-note"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="添加备注..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddRecord}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总记录数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">
              完成 {completedRecords} 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总时长
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours}h {remainingMinutes}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              共 {totalMinutes} 分钟
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均时长
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRecords > 0 ? Math.round(totalMinutes / totalRecords) : 0}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">每个番茄</p>
          </CardContent>
        </Card>
      </div>

      {/* 历史记录列表 */}
      <div className="space-y-6">
        {groupedRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>还没有番茄记录</p>
                <p className="text-sm mt-2">完成番茄钟后会自动记录在这里</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          groupedRecords.map(([dateKey, dateRecords]) => (
            <Card key={dateKey}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {format(new Date(dateKey), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                  <Badge variant="secondary" className="ml-2">
                    {dateRecords.length} 个番茄
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(record.startTime), 'HH:mm', { locale: zhCN })} -{' '}
                            {format(new Date(record.endTime), 'HH:mm', { locale: zhCN })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {record.duration}分钟
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-2">{record.taskTitle}</h4>
                        {record.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {record.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {record.note && (
                          <p className="text-sm text-muted-foreground">{record.note}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditRecord(record)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingRecordId(record.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑番茄记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">任务标题 *</Label>
              <Input
                id="edit-title"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="输入任务标题..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">标签（用逗号分隔）</Label>
              <Input
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="工作, 学习"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">日期</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">开始时间</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">时长（分钟）</Label>
              <Input
                id="edit-duration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                min="1"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">备注</Label>
              <Textarea
                id="edit-note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="添加备注..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingRecord(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleEditRecord}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条番茄记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRecordId(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
