# 番茄土豆 🍅🥔

一款高效的番茄钟任务管理工具，结合番茄工作法和任务追踪功能，帮助用户提升工作效率和时间管理能力。

在线地址：https://kabutohui.github.io/mypomotodo/

## 功能特性

### 核心功能
- 🍅 **番茄计时器**：可自定义番茄时长（默认25分钟），支持暂停、继续、停止操作
- 📝 **任务管理**：添加、编辑、删除任务，支持标签分类和拖拽排序
- 📊 **数据统计**：按日、周、月维度统计番茄数量，支持柱形图、折线图、饼图展示
- 📅 **历史记录**：按时间顺序记录所有番茄任务，支持补打记录
- ☁️ **数据同步**：支持GitHub API同步，实现多设备数据共享
- 💾 **数据备份**：支持本地导入导出JSON格式数据

### 设计特色
- 🎨 温暖的番茄红（#FF6B6B）搭配清新的薄荷绿（#4ECDC4）
- 🎯 圆角设计（8px）营造亲和感
- 📱 响应式布局，完美适配桌面和移动端
- 🌓 支持深色模式

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **UI组件库**：shadcn/ui
- **图表库**：recharts
- **日期处理**：date-fns
- **路由**：React Router v7
- **数据存储**：localStorage + GitHub API

## 快速开始

### 环境要求

```bash
Node.js ≥ 20
npm ≥ 10
```

### 安装和运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev -- --host 127.0.0.1

# 3. 访问 http://127.0.0.1:5173
```

## 使用指南

### 1. 创建任务
在首页输入任务标题、标签（用逗号分隔）和预计番茄数，点击"添加任务"按钮。

### 2. 开始番茄钟
点击任务卡片上的"开始"按钮，番茄计时器会自动启动。可以暂停、继续或停止计时。

### 3. 查看统计
在"数据统计"页面查看按日、周、月维度的番茄完成情况，以及标签分布图表。

### 4. 历史记录
在"历史记录"页面查看所有完成的番茄记录，支持补打历史记录。

### 5. 设置
在"设置"页面可以：
- 自定义番茄时长、短休息、长休息时间
- 配置GitHub同步（需要GitHub Personal Access Token）
- 导出/导入数据备份

### 6. GitHub同步配置
1. 在GitHub创建一个仓库用于存储数据
2. 生成Personal Access Token（需要repo权限）
3. 在设置页面填写GitHub配置信息
4. 点击"上传到GitHub"或"从GitHub下载"进行数据同步

## GitHub Pages 部署

本项目已配置自动部署到GitHub Pages。详细部署指南请查看 [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)

### 快速部署步骤

1. **创建GitHub仓库并推送代码**
   ```bash
   git init
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **配置GitHub Pages**
   - 进入仓库的 Settings → Pages
   - Source 选择 "GitHub Actions"

3. **自动部署**
   - 代码推送后会自动触发部署
   - 在 Actions 标签页查看部署进度
   - 部署成功后访问：`https://你的用户名.github.io/你的仓库名/`

### 本地构建测试

```bash
# 构建项目
pnpm run build:pages

# 预览构建结果
pnpm run preview
```

### 注意事项

- 项目使用pnpm作为包管理器
- 自动部署配置在 `.github/workflows/deploy.yml`
- base路径会根据仓库名自动配置
- 如使用自定义域名，需修改 `vite.config.ts` 中的base为 `'/'`

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── layouts/        # 布局组件
│   │   └── AppLayout.tsx
│   ├── ui/             # UI组件库（shadcn/ui）
│   └── PomodoroTimer.tsx  # 番茄计时器
├── pages/              # 页面目录
│   ├── TasksPage.tsx   # 任务管理页
│   ├── StatsPage.tsx   # 数据统计页
│   ├── HistoryPage.tsx # 历史记录页
│   └── SettingsPage.tsx # 设置页
├── lib/                # 工具库
│   ├── storage.ts      # 本地存储
│   ├── github-sync.ts  # GitHub同步
│   ├── stats.ts        # 统计计算
│   └── utils.ts        # 工具函数
├── types/              # 类型定义
│   └── index.ts
├── hooks/              # 自定义Hooks
├── contexts/           # React Context
├── App.tsx             # 应用入口
├── routes.tsx          # 路由配置
└── index.css           # 全局样式
```

## 数据存储说明

- **本地存储**：所有数据存储在浏览器的localStorage中，清除浏览器数据会导致数据丢失
- **GitHub同步**：配置GitHub同步后，数据会以JSON格式存储在指定的GitHub仓库中
- **数据备份**：建议定期使用"导出数据"功能备份数据到本地

## 常见问题

### Q: 数据会丢失吗？
A: 数据存储在浏览器localStorage中，只要不清除浏览器数据就不会丢失。建议配置GitHub同步或定期导出备份。

### Q: 如何在多个设备间同步数据？
A: 在设置页面配置GitHub同步，在不同设备上使用相同的GitHub配置即可实现数据同步。

### Q: GitHub Token如何获取？
A: 访问 GitHub Settings → Developer settings → Personal access tokens → Generate new token，勾选repo权限。

### Q: 支持哪些浏览器？
A: 支持所有现代浏览器（Chrome、Firefox、Safari、Edge等）。

## 开源协议

MIT License

Copyright © 2025 番茄土豆

## 了解更多

查看帮助文档：[源码导出](https://cloud.baidu.com/doc/MIAODA/s/Xmewgmsq7)
