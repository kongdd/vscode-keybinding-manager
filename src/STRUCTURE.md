# 项目结构说明

## 文件组织

项目已按功能模块化，各文件职责如下：

### 核心文件

- **`extension.ts`** - 扩展入口文件，负责激活扩展和注册命令
- **`index.ts`** - 模块导出文件，便于统一管理导出

### 类型定义

- **`types.ts`** - TypeScript接口定义
  - `KeybindingItem` - 键绑定项接口
  - `ExtensionConfig` - 扩展配置接口

### 工具模块

- **`utils.ts`** - 基础工具函数
  - `getUserConfigPath()` - 获取用户配置目录
  - `getKeybindingsPath()` - 获取键绑定文件路径
  - `stripJsonComments()` - 去除JSON注释

### 配置管理

- **`config.ts`** - 配置管理模块
  - `getExtensionConfig()` - 获取扩展配置

### 文件操作

- **`fileOperations.ts`** - 文件读取和处理
  - `readJsoncFile()` - 安全读取JSONC文件
  - `getAllKeybindingsFiles()` - 获取所有键绑定文件
  - `mergeKeybindings()` - 合并和去重键绑定

### 初始化功能

- **`initialization.ts`** - 系统初始化和设置
  - `initializeKeybindingsManager()` - 初始化管理系统
  - `setupKeybindingsFolder()` - 设置管理文件夹
  - `migrateExistingKeybindings()` - 迁移现有文件
  - `resetKeybindingsManager()` - 重置管理系统

### 备份管理

- **`backup.ts`** - 备份和恢复功能
  - `backupKeybindingsFile()` - 备份键绑定文件（带时间戳）
  - `restoreKeybindings()` - 恢复任意备份文件
  - `restoreOriginalKeybindings()` - 恢复用户原始配置

### 同步功能

- **`sync.ts`** - 同步相关功能
  - `syncKeybindings()` - 同步键绑定文件
  - `backupAndSyncKeybindings()` - 备份并同步

### 文件创建

- **`fileCreator.ts`** - 新文件创建功能
  - `createNewKeybindingsFile()` - 创建新的键绑定文件

### 文件监听

- **`watcher.ts`** - 文件监听功能
  - `watchKeybindingsFiles()` - 监听文件变化

## 系统工作流程

### 1. 初始化流程
1. 用户首次使用时，系统提示设置keybindings管理文件夹
2. 用户输入文件夹名称，系统创建文件夹并更新配置
3. 检测现有的keybindings.json文件
4. 如果存在且有内容，提示用户是否迁移
5. 迁移时创建两个文件：
   - `keybindings-main.json` - 用于管理的主文件
   - `keybindings-backup.json` - 用户原始配置的备份
6. 将keybindings-main.json复制到管理文件夹中

### 2. 日常使用流程
1. 用户在管理文件夹中创建和编辑各种keybindings文件
2. 系统监听文件变化，自动合并所有文件
3. 合并后的结果写入到keybindings.json供VS Code使用
4. 支持手动同步、备份恢复等操作

## 配置说明

扩展现在使用简化的配置结构：

### 配置项

- **`keybindingsManager.files`** - 要合并的keybindings文件列表（相对于用户配置目录）
- **`keybindingsManager.folder`** - 要扫描的keybindings文件夹（支持相对和绝对路径）
- **`keybindingsManager.filePattern`** - 在文件夹中查找keybindings文件的模式
- **`keybindingsManager.autoSync`** - 当keybindings文件变化时自动同步

### 路径支持

现在 `folder` 配置支持多种路径格式：

**相对路径**（相对于用户配置目录）：
- `"keybindings"` → `C:\Users\用户名\AppData\Roaming\Code\User\keybindings`
- `"my-configs/keybindings"` → `C:\Users\用户名\AppData\Roaming\Code\User\my-configs\keybindings`

**绝对路径**：
- `"D:\\my-keybindings"` → `D:\my-keybindings`
- `"/home/user/keybindings"` → `/home/user/keybindings`

### 配置优化

之前的配置使用 `folders` 数组支持多个文件夹，现在简化为单个 `folder` 字符串：
- **优势**: 配置更简单，大多数用户只需要一个文件夹
- **简化**: 减少了配置复杂度和管理开销
- **聚焦**: 让用户专注于一个主要的管理文件夹
- **灵活性**: 支持相对路径和绝对路径，适应不同用户需求

## 模块化优势

1. **可维护性** - 每个模块职责单一，便于维护
2. **可重用性** - 模块可以独立测试和重用
3. **可扩展性** - 新功能可以作为独立模块添加
4. **可读性** - 代码结构清晰，易于理解
5. **团队协作** - 不同开发者可以专注于不同模块

## 依赖关系

```
extension.ts (入口)
├── initialization.ts (初始化)
├── sync.ts (同步功能)
├── backup.ts (备份功能)
├── fileCreator.ts (文件创建)
├── watcher.ts (文件监听)
└── [其他模块通过这些主模块间接依赖]

主要依赖流：
- initialization.ts → config.ts, utils.ts
- sync.ts → fileOperations.ts, backup.ts
- backup.ts → utils.ts
- fileOperations.ts → types.ts, utils.ts, config.ts
- watcher.ts → utils.ts, config.ts, sync.ts
- fileCreator.ts → utils.ts
```

## 新增功能

### 命令列表
- `keybindings-manager.initialize` - 初始化Keybindings管理器
- `keybindings-manager.setupFolder` - 设置Keybindings文件夹
- `keybindings-manager.migrate` - 迁移现有Keybindings文件
- `keybindings-manager.sync` - 同步所有Keybindings文件
- `keybindings-manager.createNew` - 创建新的Keybindings文件
- `keybindings-manager.backupAndSync` - 备份原文件并同步Keybindings
- `keybindings-manager.restore` - 恢复Keybindings备份文件
- `keybindings-manager.restoreOriginal` - 恢复原始Keybindings配置
- `keybindings-manager.reset` - 重置Keybindings管理器

## 备份文件说明

系统会创建三种类型的备份：

1. **`keybindings-backup.json`** - 用户原始配置的永久备份
   - 在迁移时自动创建
   - 保存用户使用管理器前的完整配置
   - 可通过"恢复原始Keybindings配置"命令快速恢复

2. **`keybindings-backup-{timestamp}.json`** - 带时间戳的操作备份
   - 在执行"备份并同步"操作时创建
   - 记录特定时间点的配置状态
   - 便于回滚到历史版本

3. **`keybindings-main.json`** - 管理主文件
   - 基于用户原始配置创建的管理文件
   - 会被复制到管理文件夹中
   - 作为管理系统的基础配置文件
