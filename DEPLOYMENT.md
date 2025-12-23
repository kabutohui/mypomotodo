# 部署指南

本文档介绍如何将番茄土豆应用部署到GitHub Pages。

## 方法一：使用GitHub Actions自动部署（推荐）

### 步骤1：准备GitHub仓库

1. 在GitHub上创建一个新仓库
2. 将代码推送到仓库的main分支

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 步骤2：配置GitHub Pages

1. 进入仓库的 Settings → Pages
2. 在 "Build and deployment" 部分：
   - Source: 选择 "GitHub Actions"
3. 保存设置

### 步骤3：配置base路径（如果需要）

如果你的仓库名不是 `username.github.io`，需要配置base路径：

1. 在项目根目录创建 `.env.production` 文件：

```bash
# 将 repo-name 替换为你的仓库名
VITE_BASE_PATH=/repo-name/
```

2. 提交并推送更改：

```bash
git add .env.production
git commit -m "Add production base path"
git push
```

### 步骤4：触发部署

推送代码到main分支后，GitHub Actions会自动构建和部署：

```bash
git push origin main
```

### 步骤5：访问应用

部署完成后，访问：
- 如果仓库名是 `username.github.io`：https://username.github.io/
- 其他仓库名：https://username.github.io/repo-name/

## 方法二：手动部署

### 步骤1：构建项目

```bash
# 如果需要设置base路径
export VITE_BASE_PATH=/repo-name/

# 构建项目
npm run build
```

### 步骤2：部署到GitHub Pages

```bash
cd dist

# 初始化git仓库
git init
git add -A
git commit -m 'deploy'

# 推送到gh-pages分支
git push -f git@github.com:你的用户名/你的仓库名.git main:gh-pages

cd -
```

### 步骤3：配置GitHub Pages

1. 进入仓库的 Settings → Pages
2. 在 "Build and deployment" 部分：
   - Source: 选择 "Deploy from a branch"
   - Branch: 选择 "gh-pages" 和 "/ (root)"
3. 保存设置

## 方法三：使用gh-pages包

### 步骤1：安装gh-pages

```bash
npm install --save-dev gh-pages
```

### 步骤2：添加部署脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 步骤3：部署

```bash
# 如果需要设置base路径
export VITE_BASE_PATH=/repo-name/

# 部署
npm run deploy
```

## 自定义域名

如果你想使用自定义域名：

### 步骤1：配置DNS

在你的域名提供商处添加CNAME记录：
- 类型：CNAME
- 名称：www（或其他子域名）
- 值：username.github.io

### 步骤2：在GitHub配置自定义域名

1. 进入仓库的 Settings → Pages
2. 在 "Custom domain" 输入你的域名
3. 勾选 "Enforce HTTPS"

### 步骤3：添加CNAME文件

在 `public` 目录下创建 `CNAME` 文件：

```
your-domain.com
```

### 步骤4：更新base路径

如果使用自定义域名，base路径应该设置为 `/`：

```bash
# .env.production
VITE_BASE_PATH=/
```

## 常见问题

### Q: 部署后页面空白或404错误
A: 检查base路径配置是否正确。如果仓库名不是 `username.github.io`，需要设置 `VITE_BASE_PATH`。

### Q: GitHub Actions部署失败
A: 检查仓库的 Settings → Actions → General，确保 "Workflow permissions" 设置为 "Read and write permissions"。

### Q: 如何查看部署日志
A: 进入仓库的 Actions 标签页，点击最新的workflow运行记录查看详细日志。

### Q: 部署后样式丢失
A: 确保 `index.html` 中的资源引用使用相对路径，Vite会自动处理base路径。

## 验证部署

部署成功后，你应该能够：
1. 访问应用URL
2. 看到番茄土豆的界面
3. 创建任务并使用番茄计时器
4. 查看统计和历史记录
5. 配置设置和GitHub同步

## 更新部署

每次推送到main分支，GitHub Actions会自动重新部署应用。

手动部署时，重复执行部署命令即可。

## 回滚

如果需要回滚到之前的版本：

1. 在GitHub仓库的 Actions 标签页找到之前成功的部署
2. 点击 "Re-run all jobs" 重新运行该部署

或者手动回滚：

```bash
# 切换到之前的提交
git checkout <commit-hash>

# 重新部署
npm run build
# 然后按照手动部署步骤操作
```

## 监控

GitHub Pages提供基本的访问统计：
- 进入仓库的 Insights → Traffic 查看访问量

如果需要更详细的分析，可以集成Google Analytics或其他分析工具。
