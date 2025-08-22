import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as glob from 'glob';
import { KeybindingItem, ExtensionConfig, getUserConfigPath, stripJsonComments } from './config';


// 安全地读取JSONC文件
export function readJsoncFile(filePath: string): KeybindingItem[] {
    try {
        if (!fs.existsSync(filePath)) return [];

        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(stripJsonComments(content));

        return Array.isArray(parsed)
            ? parsed.filter((item): item is KeybindingItem =>
                item?.key && item?.command && typeof item.key === 'string' && typeof item.command === 'string')
            : [];
    } catch (error) {
        vscode.window.showWarningMessage(`读取文件失败: ${path.basename(filePath)}`);
        return [];
    }
}

// 获取所有keybindings文件路径
export function getAllKeybindingsFiles(config: ExtensionConfig): string[] {
    const userConfigPath = getUserConfigPath();
    const files: string[] = [];

    // 处理单个文件列表
    if (config.files && config.files.length > 0) {
        config.files.forEach(file => {
            const filePath = path.isAbsolute(file) ? file : path.join(userConfigPath, file);
            if (fs.existsSync(filePath)) {
                files.push(filePath);
            }
        });
    }

    // 处理文件夹扫描
    if (config.folderPath && config.folderPath.trim()) {
        const folderPath = path.isAbsolute(config.folderPath)
            ? config.folderPath
            : path.join(userConfigPath, config.folderPath);

        if (fs.existsSync(folderPath)) {
            // 修复glob路径：将反斜杠转换为正斜杠，并使用正确的模式
            const normalizedFolderPath = folderPath.replace(/\\/g, '/');
            const pattern = `${normalizedFolderPath}/${config.filePattern || '*.jsonc'}`;
            const folderFiles = glob.sync(pattern);
            console.log(`找到文件: ${folderFiles.length} 个`, folderFiles);
            files.push(...folderFiles);
        } else {
            console.log(`文件夹不存在: ${folderPath}`);
        }
    }
    // 去重并返回
    return [...new Set(files)];
}

// 读取、合并和去重keybindings
export function mergeKeybindings(sources: string[]): KeybindingItem[] {
    const seen = new Set<string>();
    return sources.flatMap(readJsoncFile).filter(item => {
        const id = `${item.key}|${item.command}|${item.when || ''}`;
        return seen.has(id) ? false : (seen.add(id), true);
    });
}
