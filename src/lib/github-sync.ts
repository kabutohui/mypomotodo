import type { GitHubSyncConfig, PomodoroTask, PomodoroRecord } from '@/types';
import { exportAllData, importAllData, loadTasks, loadRecords, saveTasks, saveRecords } from './storage';

interface GitHubFileResponse {
  content: string;
  sha: string;
}

interface AllData {
  tasks: PomodoroTask[];
  records: PomodoroRecord[];
  settings: any;
  version: string;
  exportedAt: string;
}

// 合并任务数据（避免冲突）
const mergeTasks = (localTasks: PomodoroTask[], remoteTasks: PomodoroTask[]): PomodoroTask[] => {
  const taskMap = new Map<string, PomodoroTask>();
  
  // 先添加远程任务
  remoteTasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  // 合并本地任务（本地任务优先，因为可能有最新的修改）
  localTasks.forEach(task => {
    const existingTask = taskMap.get(task.id);
    if (!existingTask) {
      // 新任务，直接添加
      taskMap.set(task.id, task);
    } else {
      // 已存在的任务，比较更新时间
      const localTime = new Date(task.updatedAt).getTime();
      const remoteTime = new Date(existingTask.updatedAt).getTime();
      if (localTime >= remoteTime) {
        // 本地更新时间更晚或相同，使用本地版本
        taskMap.set(task.id, task);
      }
    }
  });
  
  return Array.from(taskMap.values()).sort((a, b) => a.order - b.order);
};

// 合并记录数据（避免重复）
const mergeRecords = (localRecords: PomodoroRecord[], remoteRecords: PomodoroRecord[]): PomodoroRecord[] => {
  const recordMap = new Map<string, PomodoroRecord>();
  
  // 添加所有记录，使用ID去重
  [...remoteRecords, ...localRecords].forEach(record => {
    recordMap.set(record.id, record);
  });
  
  return Array.from(recordMap.values()).sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
};

// 同步数据到GitHub（先拉取，合并后上传）
export const syncToGitHub = async (config: GitHubSyncConfig): Promise<{ 
  success: boolean; 
  message: string;
  mergedTasks?: number;
  mergedRecords?: number;
}> => {
  if (!config.enabled || !config.token || !config.owner || !config.repo) {
    throw new Error('GitHub同步配置不完整');
  }

  try {
    // 1. 先尝试从GitHub拉取数据
    let remoteTasks: PomodoroTask[] = [];
    let remoteRecords: PomodoroRecord[] = [];
    let sha: string | undefined;
    
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
    
    try {
      const getResponse = await fetch(url, {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      
      if (getResponse.ok) {
        const fileData: GitHubFileResponse = await getResponse.json();
        sha = fileData.sha;
        const content = decodeURIComponent(escape(atob(fileData.content)));
        const remoteData: AllData = JSON.parse(content);
        remoteTasks = remoteData.tasks || [];
        remoteRecords = remoteData.records || [];
      }
    } catch (error) {
      // 文件不存在或读取失败，继续上传本地数据
      console.log('远程文件不存在或读取失败，将创建新文件');
    }
    
    // 2. 获取本地数据
    const localTasks = loadTasks();
    const localRecords = loadRecords();
    
    // 3. 合并数据
    const mergedTasks = mergeTasks(localTasks, remoteTasks);
    const mergedRecords = mergeRecords(localRecords, remoteRecords);
    
    // 4. 保存合并后的数据到本地
    saveTasks(mergedTasks);
    saveRecords(mergedRecords);
    
    // 5. 上传合并后的数据到GitHub
    const data = exportAllData();
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `同步番茄土豆数据 - ${new Date().toLocaleString('zh-CN')}`,
        content,
        branch: config.branch,
        ...(sha && { sha }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`上传失败: ${error.message || response.statusText}`);
    }
    
    return {
      success: true,
      message: '同步成功',
      mergedTasks: mergedTasks.length,
      mergedRecords: mergedRecords.length,
    };
  } catch (error) {
    throw error;
  }
};

// 上传数据到GitHub（旧方法，保留兼容性）
export const uploadToGitHub = async (config: GitHubSyncConfig): Promise<void> => {
  const result = await syncToGitHub(config);
  if (!result.success) {
    throw new Error(result.message);
  }
};

// 从GitHub下载数据
export const downloadFromGitHub = async (config: GitHubSyncConfig): Promise<void> => {
  if (!config.enabled || !config.token || !config.owner || !config.repo) {
    throw new Error('GitHub同步配置不完整');
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('文件不存在，请先上传数据');
    }
    throw new Error(`下载失败: ${response.statusText}`);
  }

  const fileData: GitHubFileResponse = await response.json();
  const content = decodeURIComponent(escape(atob(fileData.content)));
  const data = JSON.parse(content);

  importAllData(data);
};
