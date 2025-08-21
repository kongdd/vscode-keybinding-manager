import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

// 获取扩展配置
export function getExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('keybindingsManager');
  return {
    files: config.get<string[]>('files', []),
    folderPath: config.get<string>('folder', ''),
    filePattern: config.get<string>('filePattern', 'keybindings-*.jsonc'),
    autoSync: config.get<boolean>('autoSync', true)
  };
}
