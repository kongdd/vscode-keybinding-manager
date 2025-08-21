# Keybindings Manager 测试

本项目包含针对keybindings合并功能的完整测试套件。

## 测试结构

```
src/test/
├── keybindingsMerge.test.ts    # VS Code环境下的Mocha测试
├── standalone-test.ts          # Node.js独立测试脚本
├── testUtils.ts               # 测试专用工具函数
├── runTest.ts                 # Mocha测试运行器
└── index.ts                   # 测试入口点
```

## 运行测试

### 1. 编译测试文件

```bash
npm run compile-tests
```

### 2. 运行独立测试（推荐）

```bash
node out/test/standalone-test.js
```

这个测试脚本可以在Node.js环境中直接运行，不依赖VS Code环境。

### 3. 运行VS Code集成测试

在VS Code中使用内置的测试运行器运行`keybindingsMerge.test.ts`。

## 测试覆盖范围

测试套件覆盖以下功能：

### ✅ 基本合并功能
- [x] 合并多个keybindings文件
- [x] 去重相同的键绑定
- [x] 保留所有唯一的键绑定

### ✅ 高级功能
- [x] 处理带`when`条件的键绑定
- [x] 处理带`args`参数的键绑定
- [x] 区分相同键但不同条件的绑定

### ✅ 文件格式支持
- [x] 标准JSON格式
- [x] JSONC格式（带注释）
- [x] 去除单行注释 `//`
- [x] 去除多行注释 `/* */`
- [x] 处理尾随逗号

### ✅ 错误处理
- [x] 空文件处理
- [x] 无效JSON文件处理
- [x] 文件不存在处理
- [x] 格式验证（必须有key和command字段）
- [x] 智能错误报告（在测试环境中显示有用的警告信息）

### ✅ 工具函数
- [x] `stripJsonComments()` - 移除JSON注释
- [x] `readJsoncFile()` - 读取JSONC文件
- [x] `mergeKeybindings()` - 合并键绑定

## 测试输出示例

```
🚀 开始运行keybindings合并测试...

📁 创建临时测试目录: /tmp/keybindings-test-xxx

📋 测试1: 正确合并多个keybindings文件
✅ 应该合并所有4个键绑定
✅ 应该包含showCommands命令
✅ 应该包含newUntitledFile命令
✅ 应该包含openFile命令
✅ 应该包含save命令

📋 测试2: 正确去重相同的keybindings
✅ 应该去重相同的键绑定
✅ 重复的键绑定应该只保留一个

📋 测试3: 正确处理带when条件的keybindings
✅ 不同when条件的键绑定应该都保留
✅ 应该包含有when条件的键绑定
✅ 应该包含无when条件的键绑定

📋 测试4: 正确处理JSONC格式（带注释）
✅ 应该正确解析JSONC格式
✅ 第一个命令正确
✅ 第二个命令正确

📋 测试5: 正确处理空文件和无效文件
   📝 注意：以下警告信息是预期的，表明错误处理机制正常工作
⚠️  跳过无效文件: invalid.json (Expected property name or '}' in JSON at position 2)
✅ 应该只包含有效文件的内容
✅ 应该是save命令

📋 测试6: stripJsonComments工具函数
✅ 应该移除单行注释
✅ 应该移除行内注释
✅ 应该移除尾部注释
✅ 应该移除多行注释
✅ 应该保留键值对
✅ 应该保留命令

🎉 所有测试通过！

🧹 清理测试文件...
✅ 清理完成
```

## 测试数据示例

### 基本键绑定
```json
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands"
    },
    {
        "key": "ctrl+n",
        "command": "workbench.action.files.newUntitledFile"
    }
]
```

### 带条件的键绑定
```json
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands",
        "when": "editorTextFocus"
    }
]
```

### JSONC格式（带注释）
```jsonc
// 这是一个keybindings配置文件
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands" // 显示命令面板
    },
    /* 多行注释
       这里定义新文件快捷键 */
    {
        "key": "ctrl+n",
        "command": "workbench.action.files.newUntitledFile",
    } // 注意这里有尾随逗号
]
```

## 开发说明

- 测试使用临时目录，运行后自动清理
- 支持多种文件格式和错误情况
- 独立测试不依赖VS Code环境，便于CI/CD集成
- 测试覆盖了所有核心功能和边界情况
- **错误处理**：测试中的警告信息是预期的，表明错误处理机制正确工作
  - 空文件会被静默跳过
  - 无效JSON文件会显示有用的错误信息并被跳过
  - 只有有效的keybindings会被包含在最终结果中

## 一键运行

```bash
npm test
```

该命令会自动编译并运行所有测试，提供完整的测试报告。
