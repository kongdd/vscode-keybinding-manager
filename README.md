# Keybindings Manager

这个VSCode扩展允许你将keybindings.json分成多个文件进行管理，例如可以将R语言的快捷键和typst的快捷键分开管理。

## 功能

- 将多个keybindings文件合并到VSCode的keybindings.json中
- 支持从指定文件夹中扫描keybindings文件
- 自动监听文件变化，实时同步快捷键设置
- 提供命令快速创建新的keybindings文件
- 支持备份原始keybindings文件
- 支持恢复之前备份的keybindings文件
- 支持自定义keybindings文件路径和文件夹

## 使用方法

### 安装

1. 在VSCode扩展市场中搜索"Keybindings Manager"并安装
2. 或者从GitHub下载源码，使用`npm install`安装依赖，然后使用`npm run package`打包扩展

### 配置

1. 打开VSCode设置，搜索"Keybindings Manager"
2. 在`keybindingsManager.files`中添加你想要管理的keybindings文件名（相对于用户配置目录）
   例如：`["keybindings-r.jsonc", "keybindings-typst.jsonc"]`
3. 或者在`keybindingsManager.folder`中指定包含keybindings文件的文件夹路径：
   - **相对路径**（相对于用户配置目录）：`"keybindings"` 或 `"my-configs/keybindings"`
   - **绝对路径**：`"D:\\my-keybindings"` 或 `"/home/user/my-keybindings"`
4. 可以通过`keybindingsManager.filePattern`设置文件夹中要查找的文件模式
   默认为：`keybindings-*.jsonc`
5. 设置`keybindingsManager.autoSync`为`true`或`false`来控制是否自动同步

### 设置keybindings文件夹

1. 按下`Ctrl+Shift+P`打开命令面板
2. 输入"设置Keybindings文件夹"并执行
3. 输入文件夹路径：
   - 相对路径示例：`keybindings`、`my-configs/keybindings`
   - 绝对路径示例：`D:\my-keybindings`、`/home/user/keybindings`
4. 系统会自动创建文件夹并更新配置

### 创建新的keybindings文件

1. 按下`Ctrl+Shift+P`打开命令面板
2. 输入"创建新的Keybindings文件"并执行
3. 输入文件名（例如：keybindings-r.jsonc）
4. 在新创建的文件中添加你的快捷键设置

### 手动同步

1. 按下`Ctrl+Shift+P`打开命令面板
2. 输入"同步所有Keybindings文件"并执行

### 备份并同步

1. 按下`Ctrl+Shift+P`打开命令面板
2. 输入"备份原文件并同步Keybindings"并执行
3. 原始的keybindings.json文件将被备份到配置的备份文件夹中，并带有时间戳

### 恢复备份

1. 按下`Ctrl+Shift+P`打开命令面板
2. 输入"恢复原始Keybindings文件"并执行
3. 从列表中选择要恢复的备份文件

## keybindings文件格式

keybindings文件使用JSONC格式（支持注释的JSON），例如：

```jsonc
// R语言快捷键
[
  {
    "key": "ctrl+shift+m",
    "command": "r.runSelection",
    "when": "editorLangId == 'r'"
  },
  {
    "key": "ctrl+enter",
    "command": "r.runCurrentLine",
    "when": "editorLangId == 'r'"
  }
]
```

## 注意事项

- 当多个文件中存在相同的快捷键绑定（相同的key、command和when组合）时，只有第一个会生效
- 修改keybindings文件后，扩展会自动同步到VSCode的keybindings.json中
- 直接修改keybindings.json的内容会在下次同步时被覆盖

## 许可证

MIT
