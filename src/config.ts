import * as vscode from 'vscode';
import * as path from 'path';
// import { ExtensionConfig } from './types';

// 键绑定接口定义
export interface KeybindingItem {
    key: string;
    command: string;
    when?: string;
    args?: any;
}

// 配置接口定义
export interface ExtensionConfig {
    files: string[];
    folderPath: string;
    filePattern: string;
    autoSync: boolean;
}


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

// 获取用户配置目录路径
export function getUserConfigPath(): string {
    const osMap = {
        darwin: path.join(process.env.HOME || '', 'Library/Application Support'),
        win32: process.env.APPDATA || ''
    };
    return path.join(osMap[process.platform as keyof typeof osMap] || '/var/local', 'Code', 'User');
}

// 获取keybindings.json文件路径
export const getKeybindingsPath = () => path.join(getUserConfigPath(), 'keybindings.json');

// 从JSONC文件中去除注释
export const stripJsonComments = (str: string) => str
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 多行注释
    .replace(/^\s*\/\/.*$/gm, '')      // 单行注释
    .replace(/,(\s*[}\]])/g, '$1');    // 尾随逗号
