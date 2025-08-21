import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUserConfigPath } from './utils';

// 创建新的keybindings文件
export async function createNewKeybindingsFile(): Promise<void> {
  try {
    const fileName = await vscode.window.showInputBox({
      prompt: '输入新的keybindings文件名',
      placeHolder: 'keybindings-custom.jsonc',
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return '文件名不能为空';
        }
        if (!/^[\w\-._]+$/.test(value)) {
          return '文件名只能包含字母、数字、点号、连字符和下划线';
        }
        return undefined;
      }
    });

    if (!fileName) {
      return;
    }

    const userConfigPath = getUserConfigPath();
    const filePath = path.join(userConfigPath, fileName);

    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      const overwrite = await vscode.window.showQuickPick(['是', '否'], {
        placeHolder: '文件已存在，是否覆盖？'
      });

      if (overwrite !== '是') {
        return;
      }
    }

    // 创建默认的keybindings内容
    const defaultContent = `// ${fileName} - 自定义快捷键设置
// 在此处添加您的快捷键配置
// 格式示例:
// {
//   "key": "ctrl+shift+p",
//   "command": "workbench.action.showCommands",
//   "when": "editorTextFocus"
// }
[]
`;

    // 创建文件
    await fs.promises.writeFile(filePath, defaultContent, 'utf8');

    // 更新配置
    const config = vscode.workspace.getConfiguration('keybindingsManager');
    const files = config.get<string[]>('files', []);
    
    if (!files.includes(fileName)) {
      files.push(fileName);
      await config.update('files', files, vscode.ConfigurationTarget.Global);
    }

    // 打开新创建的文件
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`已创建新的keybindings文件: ${fileName}`);
  } catch (error) {
    console.error('创建文件失败:', error);
    vscode.window.showErrorMessage(`创建keybindings文件失败: ${error}`);
  }
}
