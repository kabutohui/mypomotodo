import { useState, useEffect } from 'react';
import { Settings, Timer, Github, Download, Upload, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { loadSettings, saveSettings, exportAllData, importAllData } from '@/lib/storage';
import { uploadToGitHub, downloadFromGitHub } from '@/lib/github-sync';
import type { AppSettings } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    saveSettings(settings);
    toast({
      title: '保存成功',
      description: '设置已保存',
    });
  };

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

  const handleUploadToGitHub = async () => {
    if (!settings.githubSync.enabled) {
      toast({
        title: '请先配置GitHub同步',
        description: '请填写完整的GitHub配置信息',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      await uploadToGitHub(settings.githubSync);
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

  const handleDownloadFromGitHub = async () => {
    if (!settings.githubSync.enabled) {
      toast({
        title: '请先配置GitHub同步',
        description: '请填写完整的GitHub配置信息',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      await downloadFromGitHub(settings.githubSync);
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

  return (
    <div className="container max-w-4xl mx-auto p-4 xl:p-8">
      <h1 className="text-3xl xl:text-4xl font-bold mb-6 xl:mb-8">设置</h1>

      {/* 番茄钟设置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            番茄钟设置
          </CardTitle>
          <CardDescription>自定义番茄钟和休息时间</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pomodoro">番茄时长（分钟）</Label>
              <Input
                id="pomodoro"
                type="number"
                min="1"
                max="60"
                value={settings.pomodoroDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pomodoroDuration: Number.parseInt(e.target.value) || 25,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortBreak">短休息（分钟）</Label>
              <Input
                id="shortBreak"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shortBreakDuration: Number.parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longBreak">长休息（分钟）</Label>
              <Input
                id="longBreak"
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    longBreakDuration: Number.parseInt(e.target.value) || 15,
                  })
                }
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
                checked={settings.autoStartBreak}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoStartBreak: checked })
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
                checked={settings.autoStartPomodoro}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoStartPomodoro: checked })
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
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, soundEnabled: checked })
                }
              />
            </div>
          </div>

          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            保存设置
          </Button>
        </CardContent>
      </Card>

      {/* 数据备份 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            数据备份
          </CardTitle>
          <CardDescription>导出或导入本地数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col xl:flex-row gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2 flex-1">
              <Download className="h-4 w-4" />
              导出数据
            </Button>
            <Button onClick={handleImport} variant="outline" className="gap-2 flex-1">
              <Upload className="h-4 w-4" />
              导入数据
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            导出的数据包含所有任务、记录和设置，可用于备份或迁移到其他设备
          </p>
        </CardContent>
      </Card>

      {/* GitHub同步 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub同步
          </CardTitle>
          <CardDescription>
            将数据同步到GitHub仓库，实现多设备数据共享
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>启用GitHub同步</Label>
            <Switch
              checked={settings.githubSync.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  githubSync: { ...settings.githubSync, enabled: checked },
                })
              }
            />
          </div>

          {settings.githubSync.enabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Personal Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={settings.githubSync.token}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        githubSync: { ...settings.githubSync, token: e.target.value },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    需要repo权限的GitHub Token
                  </p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">仓库所有者</Label>
                    <Input
                      id="owner"
                      placeholder="username"
                      value={settings.githubSync.owner}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          githubSync: { ...settings.githubSync, owner: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repo">仓库名称</Label>
                    <Input
                      id="repo"
                      placeholder="pomodoro-data"
                      value={settings.githubSync.repo}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          githubSync: { ...settings.githubSync, repo: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">分支</Label>
                    <Input
                      id="branch"
                      placeholder="main"
                      value={settings.githubSync.branch}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          githubSync: { ...settings.githubSync, branch: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filePath">文件路径</Label>
                    <Input
                      id="filePath"
                      placeholder="pomodoro-data.json"
                      value={settings.githubSync.filePath}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          githubSync: {
                            ...settings.githubSync,
                            filePath: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col xl:flex-row gap-3">
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="gap-2 flex-1"
                >
                  <Save className="h-4 w-4" />
                  保存配置
                </Button>
                <Button
                  onClick={handleUploadToGitHub}
                  disabled={isSyncing}
                  className="gap-2 flex-1"
                >
                  <Upload className="h-4 w-4" />
                  {isSyncing ? '上传中...' : '上传到GitHub'}
                </Button>
                <Button
                  onClick={handleDownloadFromGitHub}
                  disabled={isSyncing}
                  variant="secondary"
                  className="gap-2 flex-1"
                >
                  <Download className="h-4 w-4" />
                  {isSyncing ? '下载中...' : '从GitHub下载'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
