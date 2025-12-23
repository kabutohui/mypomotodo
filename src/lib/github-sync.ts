import type { GitHubSyncConfig } from '@/types';
import { exportAllData, importAllData } from './storage';

interface GitHubFileResponse {
  content: string;
  sha: string;
}

// 上传数据到GitHub
export const uploadToGitHub = async (config: GitHubSyncConfig): Promise<void> => {
  if (!config.enabled || !config.token || !config.owner || !config.repo) {
    throw new Error('GitHub同步配置不完整');
  }

  const data = exportAllData();
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;

  // 先获取文件SHA（如果存在）
  let sha: string | undefined;
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
    }
  } catch (error) {
    // 文件不存在，继续创建
  }

  // 创建或更新文件
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `更新番茄土豆数据 - ${new Date().toLocaleString('zh-CN')}`,
      content,
      branch: config.branch,
      ...(sha && { sha }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`上传失败: ${error.message || response.statusText}`);
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
