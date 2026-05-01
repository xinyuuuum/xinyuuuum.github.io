# 快速启动指南

## 最简单的方法（推荐所有人使用）
1. 直接双击打开 `simple-index.html`
2. 无需网络，无需下载，立即使用
3. 所有功能完整可用

## 情况 1：想使用 React 版本且网络正常（能访问 CDN）
1. 直接双击打开 `index.html`
2. 等待应用加载（约 3-5 秒）
3. 开始使用

## 情况 2：想使用 React 版本但网络受限（CDN 无法访问）

### 方案 A：使用离线版本
1. 双击运行 `download-libs.bat`
   - 如果出现安全警告，选择 "更多信息" → "仍要运行"
   - 需要一次性互联网连接下载库文件
2. 等待下载完成（所有文件显示 ✓）
3. 双击打开 `index-offline.html`
4. 开始使用

### 方案 B：使用本地服务器
1. 返回上级文件夹（`test` 文件夹）
2. 双击运行 `start-server.bat`
3. 等待出现 "HTTP Server started at http://localhost:8000"
4. 打开浏览器访问 http://localhost:8000
5. 开始使用

### 方案 C：手动操作
如果批处理文件无法运行：

1. 右键点击 `download-libs.ps1` → "使用 PowerShell 运行"
2. 或打开 PowerShell，执行：
   ```powershell
   cd frontend
   .\download-libs.ps1
   ```
3. 下载完成后打开 `index-offline.html`

## 常见问题

### 1. 运行批处理文件时闪退
- 右键点击 `download-libs.bat` → "编辑"
- 查看最后一行是否有 `pause`
- 或直接在文件夹中按住 Shift + 右键 → "在此处打开 PowerShell 窗口"
- 输入 `.\download-libs.bat` 执行

### 2. PowerShell 执行策略限制
以管理员身份运行 PowerShell，执行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
然后重新运行脚本。

### 3. 下载速度慢或失败
- 检查网络连接
- 尝试使用手机热点
- 手动下载文件（见 INSTRUCTIONS.md）

### 4. 打开后页面空白
- 按 F12 打开开发者工具
- 查看 "Console（控制台）" 选项卡中的错误信息
- 截图错误信息以便诊断

## 验证安装
打开 `test.html`，所有测试项应显示 ✓。

## 开始使用
成功加载后：
1. 点击右上角 "Add Interview" 添加面试记录
2. 填写详细信息
3. 使用时间线记录面试过程
4. 在复盘区域总结经验

## 数据安全
- 所有数据存储在本地浏览器
- 不会上传到任何服务器
- 清除浏览器数据会丢失记录，请定期备份