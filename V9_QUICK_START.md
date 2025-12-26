# 番茄土豆 v9 - 快速使用指南

## 🎯 新功能概览

### 1. 番茄钟后台运行 ✅
- **问题修复**：标签页切换或最小化后，番茄钟继续准确计时
- **使用方式**：正常使用，无需额外操作

### 2. 任务标签前置显示 ✅
- **显示格式**：`#工作 #重要 任务描述`
- **使用方式**：添加任务时输入 `任务描述 #标签`，显示时自动调整顺序

### 3. 智能数据同步 ✅
- **位置**：左上角同步按钮（🔄图标）
- **功能**：
  - 手动点击同步
  - 每2小时自动同步
  - 智能合并数据，避免冲突

## 🚀 快速开始

### 配置GitHub同步（5分钟）

#### 步骤1：创建GitHub Token
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 点击 "Generate token"
5. **复制token**（只显示一次！）

#### 步骤2：配置应用
1. 打开番茄土豆应用
2. 点击右上角 ⚙️ 设置按钮
3. 滚动到 "GitHub同步设置"
4. 填写配置：
   ```
   Token: ghp_xxxxxxxxxxxx（刚才复制的token）
   Owner: your-github-username
   Repo: pomodoro-backup（仓库名，可自定义）
   Branch: main
   File Path: pomodoro-data.json
   ```
5. ✅ 勾选 "启用GitHub同步"
6. 点击 "保存设置"

#### 步骤3：首次同步
1. 左上角出现 🔄 同步按钮
2. 点击同步按钮
3. 等待同步完成
4. 查看GitHub仓库，应该出现 `pomodoro-data.json` 文件

## 💡 使用技巧

### 同步按钮状态
- **静止**：可以点击同步
- **旋转**：正在同步中
- **Hover**：显示上次同步时间

### 何时需要手动同步？
- ✅ 完成重要任务后
- ✅ 切换设备前
- ✅ 修改大量数据后
- ✅ 长时间未使用后

### 自动同步说明
- 每2小时自动触发
- 首次加载时检查是否需要同步
- 后台静默执行，不影响使用

### 数据安全
- ✅ 数据存储在您的GitHub仓库
- ✅ Token仅保存在浏览器本地
- ✅ 建议使用私有仓库
- ✅ 定期备份GitHub仓库

## 🔧 常见问题

### Q1: 同步按钮不显示？
**A**: 检查是否已启用GitHub同步：
1. 打开设置
2. 确认 "启用GitHub同步" 已勾选
3. 确认所有配置项已填写

### Q2: 同步失败怎么办？
**A**: 检查以下几点：
1. Token是否正确
2. 仓库是否存在
3. 网络连接是否正常
4. Token权限是否足够（需要repo权限）

### Q3: 多设备数据会冲突吗？
**A**: 不会！智能合并算法会：
- 按时间戳保留最新修改
- 自动去重
- 保留所有唯一记录

### Q4: 如何查看同步的数据？
**A**: 访问您的GitHub仓库：
```
https://github.com/your-username/your-repo/blob/main/pomodoro-data.json
```

### Q5: 可以关闭自动同步吗？
**A**: 目前自动同步与GitHub同步绑定：
- 启用GitHub同步 = 启用自动同步
- 禁用GitHub同步 = 禁用自动同步

### Q6: 番茄钟在后台会暂停吗？
**A**: 不会！v9版本已修复此问题：
- 使用真实时间戳计时
- 不受标签页切换影响
- 确保计时准确

## 📊 数据格式

同步到GitHub的数据格式：
```json
{
  "tasks": [
    {
      "id": "1234567890",
      "title": "写代码",
      "tags": ["工作", "重要"],
      "completed": false,
      "estimatedPomodoros": 3,
      "completedPomodoros": 1,
      "createdAt": "2025-12-23T10:00:00.000Z",
      "updatedAt": "2025-12-23T11:00:00.000Z",
      "order": 0,
      "inProgress": false
    }
  ],
  "records": [
    {
      "id": "1234567891",
      "taskTitle": "写代码",
      "tags": ["工作"],
      "startTime": "2025-12-23T10:00:00.000Z",
      "endTime": "2025-12-23T10:25:00.000Z",
      "duration": 25,
      "completed": true
    }
  ],
  "settings": {
    "pomodoroDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "autoStartBreak": false,
    "autoStartPomodoro": false,
    "soundEnabled": true
  },
  "version": "1.0",
  "exportedAt": "2025-12-23T12:00:00.000Z"
}
```

## 🎓 最佳实践

### 1. 定期同步
- 每天开始工作前同步一次
- 每天结束工作后同步一次
- 重要操作后立即同步

### 2. 多设备使用
- 切换设备前先同步
- 新设备首次使用时先同步
- 避免同时在多设备操作

### 3. 数据备份
- GitHub仓库本身就是备份
- 可以定期导出本地JSON文件
- 使用设置中的"导出数据"功能

### 4. Token安全
- 不要分享您的Token
- Token泄露后立即重新生成
- 使用最小权限原则

## 📞 获取帮助

遇到问题？
1. 查看 `V9_TEST_GUIDE.md` 测试指南
2. 查看 `V9_UPDATE_NOTES.md` 详细说明
3. 检查浏览器控制台错误信息
4. 提交Issue到GitHub仓库

---

**版本**: v9  
**更新日期**: 2025-12-23  
**祝您使用愉快！🍅**
