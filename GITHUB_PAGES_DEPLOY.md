# 番茄土豆 - GitHub Pages 部署指南

本文档详细说明如何将番茄土豆应用部署到GitHub Pages。

## 📋 前置要求

- GitHub账号
- Git已安装并配置
- Node.js 20+ 和 pnpm 8+ 已安装

## 🚀 快速部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub，创建新仓库
2. 仓库名称建议：`tomato-potato` 或其他你喜欢的名称
3. 可以选择公开（Public）或私有（Private）

### 2. 推送代码到GitHub

```bash
# 初始化git仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 番茄土豆应用"

# 推送到GitHub
git push -u origin main
```

> **注意**：如果你的默认分支是`master`而不是`main`，请使用`master`。

### 3. 配置GitHub Pages

1. 进入你的GitHub仓库页面
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 下拉菜单中选择 **GitHub Actions**

![GitHub Pages设置](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/publishing-source-drop-down.webp)

### 4. 触发自动部署

代码推送到`main`或`master`分支后，GitHub Actions会自动：
1. 安装依赖
2. 构建项目
3. 部署到GitHub Pages

你可以在仓库的 **Actions** 标签页查看部署进度。

### 5. 访问你的应用

部署成功后，你的应用将在以下地址可用：

- **用户/组织站点**：`https://你的用户名.github.io/你的仓库名/`
- **自定义域名**：如果配置了自定义域名，则使用你的域名

例如：
- `https://username.github.io/tomato-potato/`

## 🔧 高级配置

### 自定义域名

如果你想使用自定义域名（如 `tomato.example.com`）：

1. 在仓库的 **Settings > Pages** 中配置自定义域名
2. 在你的域名DNS设置中添加CNAME记录
3. 修改 `vite.config.ts` 中的base路径为 `'/'`：

```typescript
export default defineConfig({
  base: '/',
  // ... 其他配置
});
```

4. 重新推送代码触发部署

### 修改base路径

如果你的仓库名称改变了，或者想手动指定base路径：

**方法1：通过环境变量（推荐）**

在GitHub仓库的 **Settings > Secrets and variables > Actions** 中添加变量：
- Name: `VITE_BASE_PATH`
- Value: `/你的仓库名/`

**方法2：直接修改vite.config.ts**

```typescript
export default defineConfig({
  base: '/你的仓库名/',
  // ... 其他配置
});
```

### 手动触发部署

1. 进入仓库的 **Actions** 标签页
2. 选择 **Deploy to GitHub Pages** workflow
3. 点击 **Run workflow** 按钮
4. 选择分支并点击 **Run workflow**

## 📝 工作流程说明

项目使用GitHub Actions自动部署，配置文件位于 `.github/workflows/deploy.yml`。

### 触发条件

- 推送到 `main` 或 `master` 分支
- 手动触发（workflow_dispatch）

### 构建过程

1. **检出代码**：获取最新代码
2. **设置Node.js**：安装Node.js 20
3. **安装pnpm**：安装pnpm包管理器
4. **缓存依赖**：缓存pnpm store以加速构建
5. **安装依赖**：运行 `pnpm install --frozen-lockfile`
6. **构建项目**：运行 `pnpm run build:pages`
7. **上传产物**：上传dist目录
8. **部署**：部署到GitHub Pages

### 环境变量

- `VITE_BASE_PATH`：自动设置为仓库名称（如果不是用户站点）

## 🐛 常见问题

### 1. 页面显示404

**原因**：base路径配置不正确

**解决方案**：
- 检查 `vite.config.ts` 中的base配置
- 确保base路径与仓库名称匹配
- 如果使用自定义域名，base应该设置为 `'/'`

### 2. 资源加载失败

**原因**：资源路径不正确

**解决方案**：
- 确保所有资源使用相对路径或通过import导入
- 检查public目录中的文件是否正确引用

### 3. 路由刷新后404

**原因**：GitHub Pages不支持SPA的客户端路由

**解决方案**：
本项目是单页面应用（只有根路径），不会出现此问题。如果将来添加多个路由，需要：
- 使用HashRouter代替BrowserRouter
- 或添加404.html重定向

### 4. 构建失败：packages field missing or empty

**原因**：pnpm检测到workspace配置文件但配置不正确

**解决方案**：
本项目已删除不必要的 `pnpm-workspace.yaml` 文件。如果你遇到此问题：
```bash
# 删除workspace配置文件
rm pnpm-workspace.yaml

# 重新安装依赖
pnpm install
```

### 5. 构建失败：其他依赖错误

**原因**：依赖安装或构建错误

**解决方案**：
- 查看Actions日志中的错误信息
- 确保本地可以成功构建：`pnpm install && pnpm run build:pages`
- 检查pnpm-lock.yaml是否已提交

## 🔄 更新应用

要更新已部署的应用：

```bash
# 修改代码后
git add .
git commit -m "更新：描述你的改动"
git push

# GitHub Actions会自动重新部署
```

## 📦 本地预览构建结果

在推送到GitHub之前，可以本地预览构建结果：

```bash
# 构建项目
pnpm run build:pages

# 预览构建结果
pnpm run preview
```

然后访问 `http://localhost:4173` 查看构建后的应用。

## 🎯 最佳实践

1. **定期备份数据**：使用GitHub同步功能备份番茄记录
2. **使用环境变量**：敏感信息使用GitHub Secrets
3. **监控部署**：关注Actions的执行结果
4. **版本管理**：使用语义化版本号标记重要更新

## 📚 相关资源

- [GitHub Pages官方文档](https://docs.github.com/pages)
- [GitHub Actions文档](https://docs.github.com/actions)
- [Vite部署文档](https://vitejs.dev/guide/static-deploy.html)

## 💡 提示

- 首次部署可能需要几分钟
- 后续更新通常在1-2分钟内完成
- 可以在Actions标签页实时查看部署进度
- 部署成功后，可能需要等待几分钟才能访问（DNS传播）

---

如有问题，请查看GitHub Actions的日志或提交Issue。
