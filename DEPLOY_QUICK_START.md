# 🚀 GitHub Pages 部署快速参考

## 一键部署（3步完成）

### 1️⃣ 推送代码到GitHub
```bash
git init
git remote add origin https://github.com/你的用户名/你的仓库名.git
git add .
git commit -m "Initial commit: 番茄土豆应用"
git push -u origin main
```

### 2️⃣ 启用GitHub Pages
1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**

### 3️⃣ 等待部署完成
- 在 **Actions** 标签页查看进度
- 部署成功后访问：`https://你的用户名.github.io/你的仓库名/`

---

## 📝 本地测试

```bash
# 构建
pnpm run build:pages

# 预览
pnpm run preview
```

---

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm run build:pages` | 构建生产版本 |
| `pnpm run preview` | 预览构建结果 |
| `pnpm run lint` | 代码检查 |

---

## 📚 详细文档

查看完整部署指南：[GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)

---

## ⚡ 自动部署

- ✅ 推送到 `main` 或 `master` 分支自动部署
- ✅ 可在 Actions 页面手动触发部署
- ✅ 自动配置base路径
- ✅ 支持自定义域名

---

## 🐛 遇到问题？

1. **页面404**：检查base路径配置
2. **构建失败**：查看Actions日志
3. **资源加载失败**：确保使用相对路径

详细问题排查请查看 [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md) 的"常见问题"部分。
