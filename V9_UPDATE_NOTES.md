# 番茄土豆 v9 功能更新说明

## 🎉 新功能和修复

### 1. ✅ 修复：番茄钟后台运行

**问题**：之前当浏览器标签页切换或最小化后，番茄钟计时会不准确或暂停。

**解决方案**：
- 使用真实时间戳（`Date.now()`）而不是简单的计数器
- 计时器基于结束时间戳计算剩余时间
- 不受标签页状态影响，确保计时准确

**技术细节**：
```typescript
// 开始时记录结束时间戳
const endTime = Date.now() + duration * 1000;
setTimerEndTime(endTime);

// 每100ms检查剩余时间
const remaining = Math.max(0, Math.ceil((timerEndTime - now) / 1000));
```

### 2. ✅ 新增：任务标签前置显示

**功能**：任务标签现在显示在任务描述之前，格式为 `#工作 任务描述`

**效果**：
- 更直观地看到任务分类
- 标签不会被压缩（`flex-shrink-0`）
- 保持良好的视觉层次

**示例**：
```
之前：任务描述 #工作 #重要
现在：#工作 #重要 任务描述
```

### 3. ✅ 新增：智能数据同步

**功能亮点**：
- 🔄 左上角同步按钮（旋转图标）
- ⏰ 每2小时自动同步
- 🤝 智能合并，避免数据冲突
- 💾 先拉取 → 合并 → 上传

**使用方法**：

#### 配置GitHub同步
1. 点击右上角设置按钮
2. 填写GitHub配置：
   - Token：GitHub Personal Access Token
   - Owner：GitHub用户名
   - Repo：仓库名
   - Branch：分支名（默认main）
   - File Path：数据文件路径（默认pomodoro-data.json）
3. 勾选"启用GitHub同步"

#### 手动同步
- 点击左上角的同步按钮（🔄图标）
- 同步时图标会旋转
- 完成后显示合并结果

#### 自动同步
- 启用GitHub同步后自动开启
- 每2小时自动同步一次
- 首次加载时检查是否需要同步

**数据合并策略**：

1. **任务合并**：
   - 按任务ID去重
   - 比较`updatedAt`时间戳
   - 保留最新修改的版本

2. **记录合并**：
   - 按记录ID去重
   - 保留所有唯一记录
   - 按时间倒序排列

**同步状态提示**：
- Hover同步按钮显示上次同步时间
- 同步成功显示合并的任务和记录数量
- 同步失败显示错误信息

## 🔧 技术改进

### 计时器优化
- 使用100ms更新频率（之前1000ms）
- 提高显示准确性
- 减少时间跳跃感

### 状态管理
```typescript
// 新增状态
const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
```

### 暂停/继续逻辑
```typescript
// 暂停时保存剩余时间
const pausePomodoro = () => {
  setPausedTimeLeft(timeLeft);
  setTimerEndTime(null);
};

// 继续时重新计算结束时间
const resumePomodoro = () => {
  const endTime = Date.now() + pausedTimeLeft * 1000;
  setTimerEndTime(endTime);
};
```

## 📝 使用建议

### GitHub Token权限
创建GitHub Token时需要以下权限：
- `repo`（完整仓库访问权限）
- 或 `public_repo`（仅公开仓库）

### 数据安全
- 数据存储在您自己的GitHub仓库
- Token仅保存在浏览器本地
- 建议使用私有仓库存储数据

### 同步频率
- 默认2小时自动同步
- 可随时手动同步
- 建议在重要操作后手动同步

## 🐛 已知问题

无

## 🔮 未来计划

- [ ] 支持自定义同步间隔
- [ ] 同步冲突解决界面
- [ ] 多设备同步状态显示
- [ ] 同步历史记录查看

## 📚 相关文档

- [GitHub Personal Access Token 创建指南](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub API 文档](https://docs.github.com/en/rest)

---

**版本**: v9  
**更新日期**: 2025-12-23  
**开发者**: 番茄土豆团队
